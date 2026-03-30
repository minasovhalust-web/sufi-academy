import { PrismaService } from '../../../prisma/prisma.service';
export interface RawScheduledLesson {
    id: string;
    title: string;
    description: string | null;
    scheduledAt: Date;
    courseId: string;
    lessonId: string | null;
    createdAt: Date;
    courseTitle?: string;
}
export declare class ScheduleRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        title: string;
        description?: string;
        scheduledAt: Date;
        courseId: string;
        lessonId?: string;
    }): Promise<RawScheduledLesson>;
    findByCourse(courseId: string): Promise<RawScheduledLesson[]>;
    findUpcomingForUser(userId: string): Promise<RawScheduledLesson[]>;
    findForInstructor(instructorId: string): Promise<RawScheduledLesson[]>;
    findById(id: string): Promise<RawScheduledLesson | null>;
    delete(id: string): Promise<void>;
}
