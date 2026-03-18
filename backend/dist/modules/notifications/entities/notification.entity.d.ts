import { NotificationType } from '@prisma/client';
export declare class NotificationEntity {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    readAt: Date | null;
    metadata: Record<string, unknown> | null;
    userId: string;
    createdAt: Date;
    constructor(partial: Partial<NotificationEntity>);
}
