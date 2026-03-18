import { NotificationType } from '@prisma/client';
import { NotificationsRepository, CreateNotificationInput } from '../repositories/notifications.repository';
import { GetNotificationsDto } from '../dto/get-notifications.dto';
export interface PaginatedNotifications {
    notifications: any[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
}
export declare class NotificationsService {
    private readonly notificationsRepository;
    constructor(notificationsRepository: NotificationsRepository);
    create(input: CreateNotificationInput): Promise<void>;
    findMyNotifications(userId: string, query: GetNotificationsDto): Promise<PaginatedNotifications>;
    markOneRead(notificationId: string, userId: string): Promise<any>;
    markAllRead(userId: string): Promise<{
        updated: number;
    }>;
    notifyUser(userId: string, type: NotificationType, title: string, body: string, metadata?: Record<string, unknown>): Promise<void>;
}
