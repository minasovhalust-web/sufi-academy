import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatRepository } from '../repositories/chat.repository';

/**
 * ChatListener — reacts to domain events relevant to the chat module.
 *
 * Listens for course.created and automatically provisions a ChatRoom,
 * so that the room is ready before any student tries to join.
 * Uses findOrCreateRoom (upsert) so it is safe to run multiple times.
 */
@Injectable()
export class ChatListener {
  private readonly logger = new Logger(ChatListener.name);

  constructor(private readonly chatRepository: ChatRepository) {}

  @OnEvent('course.created', { async: true })
  async onCourseCreated(payload: {
    courseId: string;
    instructorId: string;
    title: string;
    slug: string;
  }): Promise<void> {
    try {
      await this.chatRepository.findOrCreateRoom(payload.courseId);
      this.logger.log(`ChatRoom provisioned for course ${payload.courseId}`);
    } catch (err) {
      // Non-blocking: log but never crash the course-creation flow.
      this.logger.error(
        `Failed to provision ChatRoom for course ${payload.courseId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
