import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import {
  NotificationsRepository,
  CreateNotificationInput,
} from '../repositories/notifications.repository';
import { GetNotificationsDto } from '../dto/get-notifications.dto';

export interface PaginatedNotifications {
  notifications: any[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

/**
 * NotificationsService — business logic for user notifications.
 *
 * Rules:
 *   - Users may only read and update their OWN notifications.
 *   - Notifications are created only by NotificationsListener (via events).
 *   - Never imports Prisma — all DB access goes through NotificationsRepository.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  // ── Called by NotificationsListener ─────────────────────────────────────────

  async create(input: CreateNotificationInput): Promise<void> {
    await this.notificationsRepository.create(input);
  }

  // ── REST endpoints ───────────────────────────────────────────────────────────

  async findMyNotifications(
    userId: string,
    query: GetNotificationsDto,
  ): Promise<PaginatedNotifications> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationsRepository.findByUser(userId, {
        isRead: query.isRead,
        skip,
        take: limit,
      }),
      this.notificationsRepository.countByUser(userId, query.isRead),
      this.notificationsRepository.countUnread(userId),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: skip + notifications.length < total,
    };
  }

  async markOneRead(notificationId: string, userId: string): Promise<any> {
    const notification =
      await this.notificationsRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundException(
        `Notification #${notificationId} not found`,
      );
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }
    return this.notificationsRepository.markOneRead(notificationId);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.markAllRead(userId);
    return { updated: result.count };
  }

  // ── Convenience helpers used by listener ────────────────────────────────────

  async notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({ userId, type, title, body, metadata });
  }
}
