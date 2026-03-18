import { ActivityEventType } from '@prisma/client';
import { AnalyticsRepository, CreateActivityLogInput } from '../repositories/analytics.repository';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
export declare class AnalyticsService {
    private readonly analyticsRepository;
    constructor(analyticsRepository: AnalyticsRepository);
    logEvent(input: CreateActivityLogInput): Promise<void>;
    getSummary(query: AnalyticsQueryDto): Promise<{
        range: {
            from: Date;
            to: Date;
        };
        summary: {
            coursesCreated: number;
            studentsEnrolled: number;
            videosUploaded: number;
            messagesSent: number;
            sessionsStarted: number;
            sessionsEnded: number;
        };
        trend: {
            day: Date;
            count: number;
        }[];
    }>;
    getCourseStats(query: AnalyticsQueryDto): Promise<{
        enrollments: number;
        liveSessions: number;
        range: {
            from: Date;
            to: Date;
        };
    }>;
    getUserStats(query: AnalyticsQueryDto): Promise<{
        range: {
            from: Date;
            to: Date;
        };
        topActors: {
            actorId: string;
            count: number;
        }[];
    }>;
    log(event: ActivityEventType, actorId?: string, subjectId?: string, subjectType?: string, metadata?: Record<string, unknown>): Promise<void>;
    private toDateRange;
}
