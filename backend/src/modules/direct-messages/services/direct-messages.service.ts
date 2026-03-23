import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DirectMessagesRepository,
  DirectMessageWithUsers,
  DirectMessageUser,
} from '../repositories/direct-messages.repository';
import { GetConversationDto } from '../dto/get-conversation.dto';
import { SendDirectMessageDto } from '../dto/send-direct-message.dto';

/**
 * DirectMessagesService — business logic for 1-to-1 messaging.
 *
 * Authorization rules:
 *   - Both sender and receiver must be active users.
 *   - A user cannot message themselves.
 *   - All authenticated users can message any other active user
 *     (open policy suitable for an online academy).
 */
@Injectable()
export class DirectMessagesService {
  constructor(private readonly repo: DirectMessagesRepository) {}

  // ── Conversations list ────────────────────────────────────────────────────

  async getConversations(
    userId: string,
  ): Promise<{ user: DirectMessageUser; lastMessage: DirectMessageWithUsers }[]> {
    return this.repo.findConversations(userId);
  }

  // ── Message history ───────────────────────────────────────────────────────

  async getMessages(
    requesterId: string,
    partnerId: string,
    query: GetConversationDto,
  ): Promise<DirectMessageWithUsers[]> {
    if (requesterId === partnerId) {
      throw new ForbiddenException('You cannot view a conversation with yourself');
    }

    const exists = await this.repo.receiverExists(partnerId);
    if (!exists) throw new NotFoundException(`User #${partnerId} not found`);

    return this.repo.findMessages(requesterId, partnerId, query.limit ?? 50);
  }

  // ── Send message ──────────────────────────────────────────────────────────

  async sendMessage(
    senderId: string,
    receiverId: string,
    dto: SendDirectMessageDto,
  ): Promise<DirectMessageWithUsers> {
    if (senderId === receiverId) {
      throw new ForbiddenException('You cannot send a message to yourself');
    }

    const exists = await this.repo.receiverExists(receiverId);
    if (!exists) throw new NotFoundException(`User #${receiverId} not found`);

    return this.repo.createMessage(senderId, receiverId, dto.content);
  }
}
