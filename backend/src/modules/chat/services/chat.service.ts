import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatRepository, ChatMessageWithSender } from '../repositories/chat.repository';
import { ChatRoom } from '../entities/chat-message.entity';
import { GetMessagesDto } from '../dto/get-messages.dto';

// Import Role from common/enums or define locally
enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface PaginatedMessages {
  messages: ChatMessageWithSender[];
  /** Total messages in the room (not filtered by cursor — for UI badge). */
  total: number;
  /** True if there are more messages before the oldest one returned. */
  hasMore: boolean;
}

/**
 * ChatService — business logic for course chat.
 *
 * Access rules:
 *   - Instructor of the course: always allowed
 *   - Student with ACTIVE or COMPLETED enrollment: allowed
 *   - Everyone else: ForbiddenException
 *
 * Delete rules:
 *   - Message author: can delete their own messages
 *   - ADMIN role: can delete any message
 *   - Others: ForbiddenException
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Access validation ───────────────────────────────────────────────────────

  /**
   * Throws ForbiddenException if the user is not allowed in the chat.
   * Called before every write operation and on join-room.
   *
   * Access rules:
   *   - ADMIN role: always allowed (can moderate any chat)
   *   - Course instructor: always allowed
   *   - Student with ACTIVE enrollment: allowed
   *   - Everyone else (PENDING, COMPLETED, unenrolled): denied
   */
  async validateRoomAccess(
    courseId: string,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    if (userRole === Role.ADMIN) return;
    const allowed = await this.chatRepository.checkUserAccess(courseId, userId);
    if (!allowed) {
      throw new ForbiddenException(
        'You must be actively enrolled in this course or be the instructor to access the chat',
      );
    }
  }

  // ── Room ────────────────────────────────────────────────────────────────────

  async getOrCreateRoom(courseId: string): Promise<ChatRoom> {
    return this.chatRepository.findOrCreateRoom(courseId);
  }

  // ── Message history (REST) ──────────────────────────────────────────────────

  async getRoomMessages(
    courseId: string,
    userId: string,
    userRole: string,
    query: GetMessagesDto,
  ): Promise<PaginatedMessages> {
    await this.validateRoomAccess(courseId, userId, userRole);

    const room = await this.chatRepository.findRoomByCourse(courseId);
    if (!room) {
      return { messages: [], total: 0, hasMore: false };
    }

    const limit = query.limit ?? 50;
    const [messages, total] = await Promise.all([
      this.chatRepository.findMessages(room.id, { cursor: query.cursor, limit }),
      this.chatRepository.countMessages(room.id),
    ]);

    // Reverse from newest-first to chronological order for display
    return {
      messages: messages.reverse(),
      total,
      hasMore: messages.length === limit,
    };
  }

  // ── Send message (WebSocket) ────────────────────────────────────────────────

  /**
   * Validates access, lazily creates the room, and persists the message.
   * Returns the created message with sender info for broadcasting.
   */
  async sendMessage(
    courseId: string,
    content: string,
    senderId: string,
    senderRole?: string,
    replyToId?: string,
  ): Promise<ChatMessageWithSender> {
    await this.validateRoomAccess(courseId, senderId, senderRole);
    const room = await this.chatRepository.findOrCreateRoom(courseId);
    const message = await this.chatRepository.createMessage({
      roomId: room.id,
      senderId,
      content,
      replyToId,
    });
    this.eventEmitter.emit('chat.message.sent', {
      messageId: message.id,
      roomId: room.id,
      courseId,
      senderId,
    });
    return message;
  }

  // ── Initial history on join (WebSocket) ────────────────────────────────────

  /**
   * Returns the last N messages for a room (newest-first reversed to chrono).
   * Called after a client successfully joins a room.
   */
  async getRecentMessages(
    courseId: string,
    cursor?: string,
    limit = 50,
  ): Promise<ChatMessageWithSender[]> {
    const room = await this.chatRepository.findRoomByCourse(courseId);
    if (!room) return [];
    const messages = await this.chatRepository.findMessages(room.id, {
      cursor,
      limit,
    });
    return messages.reverse();
  }

  // ── Delete message ──────────────────────────────────────────────────────────

  async deleteMessage(
    messageId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<ChatMessageWithSender> {
    const message = await this.chatRepository.findMessage(messageId);
    if (!message) {
      throw new NotFoundException(`Message #${messageId} not found`);
    }
    if (message.deletedAt) {
      throw new BadRequestException('Message has already been deleted');
    }
    if (message.senderId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own messages');
    }
    return this.chatRepository.softDeleteMessage(messageId);
  }
}
