import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatRoom, ChatMessage, EnrollmentStatus } from '../entities/chat-message.entity';

/** Shape of a replied-to message nested inside a ChatMessageWithSender. */
export type ReplyToMessage = {
  id: string;
  content: string;
  sender: { id: string; firstName: string; lastName: string };
};

/** Shape of a message with sender info — returned from all message queries. */
export type ChatMessageWithSender = ChatMessage & {
  sender: { id: string; firstName: string; lastName: string };
  replyTo: ReplyToMessage | null;
};

/** Prisma include fragment — reused across all message queries. */
const MESSAGE_INCLUDE = {
  sender: { select: { id: true, firstName: true, lastName: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const;

/**
 * ChatRepository — sole Prisma access point for ChatModule.
 *
 * Access-control strategy (self-contained, no CoursesModule dependency):
 *   The repository queries Course and Enrollment tables directly to resolve
 *   instructor/student access, keeping ChatModule fully self-contained.
 */
@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Access control ──────────────────────────────────────────────────────────

  /**
   * Returns true if the user is the course instructor OR has an
   * ACTIVE or COMPLETED enrollment in the course.
   * Returns false if the course doesn't exist.
   */
  async checkUserAccess(courseId: string, userId: string): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) return false;
    if (course.instructorId === userId) return true;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    return enrollment?.status === EnrollmentStatus.ACTIVE;
  }

  // ── Room management ─────────────────────────────────────────────────────────

  async findRoomByCourse(courseId: string): Promise<ChatRoom | null> {
    return (this.prisma as any).chatRoom.findUnique({ where: { courseId } });
  }

  /**
   * Find-or-create the chat room for a course.
   * Uses upsert so concurrent join events are safe.
   */
  async findOrCreateRoom(courseId: string): Promise<ChatRoom> {
    return (this.prisma as any).chatRoom.upsert({
      where: { courseId },
      create: { courseId },
      update: {},
    });
  }

  // ── Messages ────────────────────────────────────────────────────────────────

  /**
   * Fetch messages for a room with cursor-based pagination.
   * Returns results newest-first so callers can reverse to chronological order.
   *
   * @param cursor - Message ID of the oldest visible message (load earlier pages)
   * @param limit  - Max messages to return
   */
  async findMessages(
    roomId: string,
    options: { cursor?: string; limit: number },
  ): Promise<ChatMessageWithSender[]> {
    const { cursor, limit } = options;

    let cursorDate: Date | undefined;
    if (cursor) {
      const pivot = await (this.prisma as any).chatMessage.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      cursorDate = pivot?.createdAt;
    }

    return (this.prisma as any).chatMessage.findMany({
      where: {
        roomId,
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async countMessages(roomId: string): Promise<number> {
    return (this.prisma as any).chatMessage.count({ where: { roomId } });
  }

  async createMessage(data: {
    roomId: string;
    senderId: string;
    content: string;
    replyToId?: string;
  }): Promise<ChatMessageWithSender> {
    return (this.prisma as any).chatMessage.create({
      data: {
        content: data.content,
        room: { connect: { id: data.roomId } },
        sender: { connect: { id: data.senderId } },
        ...(data.replyToId ? { replyTo: { connect: { id: data.replyToId } } } : {}),
      },
      include: MESSAGE_INCLUDE,
    });
  }

  async findMessage(id: string): Promise<ChatMessage | null> {
    return (this.prisma as any).chatMessage.findUnique({ where: { id } });
  }

  /**
   * Soft-delete: sets deletedAt timestamp, preserves content for moderation.
   * Clients should render "[message deleted]" when deletedAt is non-null.
   */
  async softDeleteMessage(id: string): Promise<ChatMessageWithSender> {
    return (this.prisma as any).chatMessage.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: MESSAGE_INCLUDE,
    });
  }
}
