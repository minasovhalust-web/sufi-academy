import { LessonsService } from '../services/lessons.service';
import { CreateLessonDto } from '../dto/lesson/create-lesson.dto';
import { UpdateLessonDto } from '../dto/lesson/update-lesson.dto';
export declare class LessonsController {
    private readonly lessonsService;
    constructor(lessonsService: LessonsService);
    create(moduleId: string, dto: CreateLessonDto, req: any): Promise<any>;
    findAll(courseId: string, moduleId: string, req: any): Promise<any[]>;
    findOne(courseId: string, id: string, req: any): Promise<any>;
    update(id: string, dto: UpdateLessonDto, req: any): Promise<any>;
    remove(id: string, req: any): Promise<void>;
}
