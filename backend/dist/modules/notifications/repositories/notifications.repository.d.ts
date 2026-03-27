import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
}
export declare class NotificationsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: CreateNotificationInput): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        metadata: Prisma.JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
        body: string;
        readAt: Date | null;
    }>;
    findByUser(userId: string, options: {
        isRead?: boolean;
        skip: number;
        take: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        metadata: Prisma.JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
        body: string;
        readAt: Date | null;
    }[]>;
    countByUser(userId: string, isRead?: boolean): Promise<number>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        metadata: Prisma.JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
        body: string;
        readAt: Date | null;
    }>;
    markOneRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        metadata: Prisma.JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
        body: string;
        readAt: Date | null;
    }>;
    markAllRead(userId: string): Promise<Prisma.BatchPayload>;
    countUnread(userId: string): Promise<number>;
}
