import { Role } from '@prisma/client';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { CreateScheduledLessonDto } from '../dto/create-scheduled-lesson.dto';
export declare class ScheduleService {
    private readonly scheduleRepository;
    constructor(scheduleRepository: ScheduleRepository);
    createLesson(courseId: string, dto: CreateScheduledLessonDto, requesterId: string, requesterRole: Role): Promise<import("../repositories/schedule.repository").RawScheduledLesson>;
    getCourseLessons(courseId: string): Promise<import("../repositories/schedule.repository").RawScheduledLesson[]>;
    deleteLesson(id: string, requesterId: string, requesterRole: Role): Promise<void>;
    getMySchedule(userId: string, role: Role): Promise<import("../repositories/schedule.repository").RawScheduledLesson[]>;
}
