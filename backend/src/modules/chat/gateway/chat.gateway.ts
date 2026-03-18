import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chat.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { JoinRoomDto } from '../dto/join-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { DeleteMessageDto } from '../dto/delete-message.dto';

// Role enum
enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

/** Socket.io room name for a course. Prefixed to avoid collisions. */
const roomKey = (courseId: string) => `course:${courseId}`;

/**
 * ChatGateway — Socket.IO gateway for course chat.
 *
 * Namespace: /chat
 * Socket.io room per course: "course:{courseId}"
 *
 * Authentication:
 *   JWT is extracted from the socket handshake on connection:
 *     - client.handshake.auth.token  (preferred)
 *     - Authorization: Bearer <token> header
 *   Invalid/missing token → socket is disconnected immediately.
 *   Authenticated user is stored on client.data.user for the session.
 *
 * Events (client → server):
 *   join-room      { courseId, cursor? }  → room-history | exception
 *   leave-room     { courseId }           → (no response)
 *   send-message   { courseId, content }  → broadcasts new-message to room
 *   delete-message { messageId, courseId }→ broadcasts message-deleted to room
 *   typing         { courseId }           → broadcasts user-typing to room (excl. sender)
 *
 * Events (server → client):
 *   room-history    { messages, hasMore }
 *   new-message     ChatMessageWithSender
 *   message-deleted { messageId, courseId, deletedAt }
 *   user-typing     { userId, firstName, lastName }
 *   room-joined     { courseId, socketId }
 *   exception       { message, event? }
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Connection lifecycle ────────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync(token);

      // Normalise sub → id (handles both JWT payload shapes)
      client.data.user = {
        id: payload.sub ?? payload.id,
        email: payload.email,
        role: payload.role as Role,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };

      this.logger.log(
        `Client connected: ${client.id} (user: ${client.data.user.id})`,
      );
    } catch {
      this.logger.warn(`Unauthorized WS connection rejected: ${client.id}`);
      client.emit('exception', { message: 'Unauthorized: invalid or missing token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  /**
   * join-room — validate access, subscribe to the socket.io room,
   * and immediately emit the recent message history to the joining client.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<void> {
    try {
      await this.chatService.validateRoomAccess(dto.courseId, client.data.user.id, client.data.user.role);

      const room = roomKey(dto.courseId);
      await client.join(room);

      const messages = await this.chatService.getRecentMessages(
        dto.courseId,
        dto.cursor,
      );

      client.emit('room-history', {
        messages,
        hasMore: messages.length >= 50,
      });

      client.emit('room-joined', {
        courseId: dto.courseId,
        socketId: client.id,
      });

      this.logger.log(
        `User ${client.data.user.id} joined room ${room}`,
      );
    } catch (error) {
      this.emitException(client, 'join-room', (error as Error).message);
    }
  }

  /**
   * leave-room — unsubscribe from the socket.io room.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<void> {
    const room = roomKey(dto.courseId);
    await client.leave(room);
    this.logger.log(`User ${client.data.user.id} left room ${room}`);
  }

  /**
   * send-message — persist and broadcast to all room members.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ): Promise<void> {
    try {
      const message = await this.chatService.sendMessage(
        dto.courseId,
        dto.content,
        client.data.user.id,
        client.data.user.role,
        dto.replyToId,
      );

      this.server.to(roomKey(dto.courseId)).emit('new-message', message);
    } catch (error) {
      this.emitException(client, 'send-message', (error as Error).message);
    }
  }

  /**
   * delete-message — soft-delete and notify all room members.
   * Only the author or an ADMIN can delete.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteMessageDto,
  ): Promise<void> {
    try {
      const deleted = await this.chatService.deleteMessage(
        dto.messageId,
        client.data.user.id,
        client.data.user.role,
      );

      this.server.to(roomKey(dto.courseId)).emit('message-deleted', {
        messageId: dto.messageId,
        courseId: dto.courseId,
        deletedAt: deleted.deletedAt,
      });
    } catch (error) {
      this.emitException(client, 'delete-message', (error as Error).message);
    }
  }

  /**
   * typing — broadcast a typing indicator to everyone in the room EXCEPT the sender.
   * No persistence — purely ephemeral; clients should auto-clear after ~3 s.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): void {
    client.to(roomKey(dto.courseId)).emit('user-typing', {
      userId: client.data.user.id,
      firstName: client.data.user.firstName,
      lastName: client.data.user.lastName,
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Extract JWT from handshake.
   * Priority: auth.token → Authorization header.
   */
  private extractToken(client: Socket): string {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth;

    const authHeader = client.handshake.headers?.authorization as string | undefined;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

    throw WsException('No authentication token provided');
  }

  private emitException(
    client: Socket,
    event: string,
    message: string,
  ): void {
    client.emit('exception', { event, message });
  }
}
