import { AnalyticsService } from '../services/analytics.service';
export declare class AnalyticsListener {
    private readonly analyticsService;
    private readonly logger;
    constructor(analyticsService: AnalyticsService);
    onCourseCreated(payload: {
        courseId: string;
        instructorId: string;
        title: string;
        slug: string;
    }): Promise<void>;
    onStudentEnrolled(payload: {
        courseId: string;
        studentId: string;
        instructorId: string;
        courseTitle: string;
    }): Promise<void>;
    onVideoUploaded(payload: {
        videoId: string;
        lessonId: string;
        instructorId: string;
        title: string;
    }): Promise<void>;
    onChatMessageSent(payload: {
        messageId: string;
        roomId: string;
        courseId: string;
        senderId: string;
    }): Promise<void>;
    onLiveSessionStarted(payload: {
        sessionId: string;
        courseId: string;
        hostId: string;
        title: string;
    }): Promise<void>;
    onLiveSessionEnded(payload: {
        sessionId: string;
        courseId: string;
        hostId: string;
        title: string;
        endedAt: Date;
    }): Promise<void>;
}
