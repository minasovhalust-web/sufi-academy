import { NotificationsService } from '../services/notifications.service';
export declare class NotificationsListener {
    private readonly notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
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
    onTeacherAssigned(payload: {
        userId: string;
        assignedById: string;
    }): Promise<void>;
}
