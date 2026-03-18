import { ActivityEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export interface CreateActivityLogInput {
    event: ActivityEventType;
    actorId?: string;
    subjectId?: string;
    subjectType?: string;
    metadata?: Record<string, unknown>;
}
export interface DateRange {
    from: Date;
    to: Date;
}
export declare class AnalyticsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createLog(input: CreateActivityLogInput): Promise<{
        event: import(".prisma/client").$Enums.ActivityEventType;
        id: string;
        createdAt: Date;
        metadata: Prisma.JsonValue | null;
        actorId: string | null;
        subjectId: string | null;
        subjectType: string | null;
    }>;
    countByEventType(range: DateRange): Promise<{
        event: import(".prisma/client").$Enums.ActivityEventType;
        count: number;
    }[]>;
    countByDay(range: DateRange): Promise<{
        day: Date;
        count: number;
    }[]>;
    courseStats(range: DateRange): Promise<{
        enrollments: number;
        liveSessions: number;
    }>;
    topActors(range: DateRange, limit?: number): Promise<{
        actorId: string;
        count: number;
    }[]>;
    summary(range: DateRange): Promise<{
        coursesCreated: number;
        studentsEnrolled: number;
        videosUploaded: number;
        messagesSent: number;
        sessionsStarted: number;
        sessionsEnded: number;
    }>;
}
