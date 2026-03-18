import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
}
