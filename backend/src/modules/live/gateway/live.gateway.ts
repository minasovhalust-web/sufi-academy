import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Role } from '@prisma/client';
import { LiveService } from '../services/live.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { SessionActionDto } from '../dto/session-action.dto';
import { MicActionDto } from '../dto/mic-action.dto';
import { WebRtcSignalDto } from '../dto/webrtc-signal.dto';

/** Socket.io room name for a live session. */
const sessionRoom = (sessionId: string) => `live:${sessionId}`;

/**
 * LiveGateway — Socket.IO gateway for WebRTC live classes.
 *
 * Namespace: /live
 * Socket.io room per session: "live:{sessionId}"
 *
 * ── Authentication ──────────────────────────────────────────────────────────
 * JWT extracted from handshake on connection:
 *   - client.handshake.auth.token  (preferred by socket.io client)
 *   - Authorization: Bearer <token> header
 * Unauthorized clients are disconnected immediately in handleConnection.
 * client.data.user holds the decoded payload for the socket's lifetime.
 *
 * ── WebRTC Signaling ────────────────────────────────────────────────────────
 * The gateway acts as a pure signaling relay:
 *   - userSockets Map<userId, socketId> enables direct peer targeting
 *   - webrtc-signal events are forwarded opaquely; no media data is processed
 *   - Both peers must be connected to the /live namespace
 *
 * ── Events (client → server) ────────────────────────────────────────────────
 *   join-session     { sessionId }                   → session-state | exception
 *   leave-session    { sessionId }                   → (broadcasts participant-left)
 *   raise-hand       { sessionId }                   → broadcasts hand-raised
 *   grant-mic        { sessionId, targetUserId }     → broadcasts mic-granted (host only)
 *   revoke-mic       { sessionId, targetUserId }     → broadcasts mic-revoked (host only)
 *   webrtc-signal    { sessionId, targetUserId, signal } → forwarded to target peer
 *   end-session      { sessionId }                   → broadcasts session-ended (host only)
 *
 * ── Events (server → client) ────────────────────────────────────────────────
 *   session-state    { session, participants, activeCount }  → joining client only
 *   participant-joined { userId, firstName, lastName, role, micEnabled, handRaised }
 *   participant-left   { userId, sessionId }
 *   hand-raised        { userId, sessionId }
 *   mic-granted        { userId, sessionId }
 *   mic-revoked        { userId, sessionId }
 *   webrtc-signal      { fromUserId, sessionId, signal }     → target peer only
 *   session-ended      { sessionId, endedAt }
 *   exception          { event, message }
 */
@WebSocketGateway({
  namespace: '/live',
  cors: {
    origin: '*', // tighten to frontend origin in production
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(LiveGateway.name);

  /**
   * userId → socketId for direct WebRTC peer-to-peer signal routing.
   * One entry per connected user (last connection wins for multi-tab edge cases).
   */
  private readonly userSockets = new Map<string, string>();

  constructor(
    private readonly liveService: LiveService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Connection lifecycle ────────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync(token);

      client.data.user = {
        id: payload.sub ?? payload.id,
        email: payload.email,
        role: payload.role as Role,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };

      this.userSockets.set(client.data.user.id, client.id);
      this.logger.log(`[/live] Connected: ${client.id} (user: ${client.data.user.id})`);
    } catch {
      this.logger.warn(`[/live] Unauthorized connection rejected: ${client.id}`);
      client.emit('exception', { message: 'Unauthorized: invalid or missing token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.user?.id;
    if (!userId) return;

    this.userSockets.delete(userId);

    // Auto-leave all live session rooms the disconnecting socket was in
    const roomsArray = Array.from((client as any).rooms || []) as string[];
    for (const room of roomsArray) {
      if (room.startsWith('live:')) {
        const sessionId = room.slice(5); // strip "live:" prefix
        // Fire-and-forget: don't block disconnect on DB write
        this.liveService.leaveSession(sessionId, userId).catch(() => {});
        this.server.to(room).emit('participant-left', { userId, sessionId });
      }
    }

    this.logger.log(`[/live] Disconnected: ${client.id} (user: ${userId})`);
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  /**
   * join-session — validate access, subscribe to the socket.io room,
   * send full session state to the joining client, and notify room members.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SessionActionDto,
  ): Promise<void> {
    try {
      const participant = await this.liveService.joinSession(
        dto.sessionId,
        client.data.user.id,
      );

      await client.join(sessionRoom(dto.sessionId));

      // Send current state only to the joining client
      const state = await this.liveService.getSessionState(dto.sessionId);
      client.emit('session-state', state);

      // Notify all other members in the room
      client.to(sessionRoom(dto.sessionId)).emit('participant-joined', {
        userId: client.data.user.id,
        firstName: client.data.user.firstName,
        lastName: client.data.user.lastName,
        role: participant.role,
        micEnabled: participant.micEnabled,
        handRaised: participant.handRaised,
      });

      this.logger.log(
        `[/live] User ${client.data.user.id} joined session ${dto.sessionId}`,
      );
    } catch (error) {
      this.emitException(client, 'join-session', error.message);
    }
  }

  /**
   * leave-session — unsubscribe from the room and notify remaining members.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-session')
  async handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SessionActionDto,
  ): Promise<void> {
    try {
      await this.liveService.leaveSession(dto.sessionId, client.data.user.id);
      await client.leave(sessionRoom(dto.sessionId));

      this.server.to(sessionRoom(dto.sessionId)).emit('participant-left', {
        userId: client.data.user.id,
        sessionId: dto.sessionId,
      });
    } catch (error) {
      this.emitException(client, 'leave-session', error.message);
    }
  }

  /**
   * raise-hand — student signals they want to speak.
   * Broadcast to the entire room so the host sees it.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('raise-hand')
  async handleRaiseHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SessionActionDto,
  ): Promise<void> {
    try {
      await this.liveService.raiseHand(dto.sessionId, client.data.user.id);
      this.server.to(sessionRoom(dto.sessionId)).emit('hand-raised', {
        userId: client.data.user.id,
        sessionId: dto.sessionId,
      });
    } catch (error) {
      this.emitException(client, 'raise-hand', error.message);
    }
  }

  /**
   * grant-mic — host allows a participant to unmute.
   * Automatically lowers the participant's raised hand.
   * Broadcasts to all room members so clients can update their UI.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('grant-mic')
  async handleGrantMic(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MicActionDto,
  ): Promise<void> {
    try {
      await this.liveService.grantMic(
        dto.sessionId,
        dto.targetUserId,
        client.data.user.id,
        client.data.user.role,
      );
      this.server.to(sessionRoom(dto.sessionId)).emit('mic-granted', {
        userId: dto.targetUserId,
        sessionId: dto.sessionId,
      });
    } catch (error) {
      this.emitException(client, 'grant-mic', error.message);
    }
  }

  /**
   * revoke-mic — host mutes a participant.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('revoke-mic')
  async handleRevokeMic(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MicActionDto,
  ): Promise<void> {
    try {
      await this.liveService.revokeMic(
        dto.sessionId,
        dto.targetUserId,
        client.data.user.id,
        client.data.user.role,
      );
      this.server.to(sessionRoom(dto.sessionId)).emit('mic-revoked', {
        userId: dto.targetUserId,
        sessionId: dto.sessionId,
      });
    } catch (error) {
      this.emitException(client, 'revoke-mic', error.message);
    }
  }

  /**
   * webrtc-signal — pure relay of WebRTC signaling data between peers.
   *
   * The gateway:
   *   1. Looks up the target user's current socketId from userSockets map
   *   2. Forwards the opaque signal payload directly to that socket
   *   3. Never inspects or modifies the signal content
   *
   * No media bytes pass through this handler — only JSON signaling messages
   * (SDP offer/answer and ICE candidates). The actual media stream is
   * established peer-to-peer via WebRTC after signaling completes.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('webrtc-signal')
  handleWebRtcSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WebRtcSignalDto,
  ): void {
    const targetSocketId = this.userSockets.get(dto.targetUserId);

    if (!targetSocketId) {
      this.emitException(
        client,
        'webrtc-signal',
        `Peer ${dto.targetUserId} is not connected to /live`,
      );
      return;
    }

    // Forward the signal directly to the target peer's socket
    this.server.to(targetSocketId).emit('webrtc-signal', {
      fromUserId: client.data.user.id,
      sessionId: dto.sessionId,
      signal: dto.signal,
    });
  }

  /**
   * end-session — host terminates the live session via WebSocket.
   * Broadcasts session-ended to all participants so they can clean up
   * their WebRTC peer connections and UI state.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('end-session')
  async handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SessionActionDto,
  ): Promise<void> {
    try {
      const ended = await this.liveService.endSession(
        dto.sessionId,
        client.data.user.id,
        client.data.user.role,
      );
      this.server.to(sessionRoom(dto.sessionId)).emit('session-ended', {
        sessionId: dto.sessionId,
        endedAt: ended.endedAt,
      });

      this.logger.log(
        `[/live] Session ${dto.sessionId} ended by user ${client.data.user.id}`,
      );
    } catch (error) {
      this.emitException(client, 'end-session', error.message);
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private extractToken(client: Socket): string {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth;

    const authHeader = client.handshake.headers?.authorization as string | undefined;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

    throw new Error('No authentication token provided');
  }

  private emitException(client: Socket, event: string, message: string): void {
    client.emit('exception', { event, message });
  }
}
