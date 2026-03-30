import { ScheduleService } from '../services/schedule.service';
import { CreateScheduledLessonDto } from '../dto/create-scheduled-lesson.dto';
export declare class ScheduleController {
    private readonly scheduleService;
    constructor(scheduleService: ScheduleService);
    create(courseId: string, dto: CreateScheduledLessonDto, req: any): Promise<import("../repositories/schedule.repository").RawScheduledLesson>;
    findByCourse(courseId: string): Promise<import("../repositories/schedule.repository").RawScheduledLesson[]>;
    findMy(req: any): Promise<import("../repositories/schedule.repository").RawScheduledLesson[]>;
    remove(id: string, req: any): Promise<void>;
}
