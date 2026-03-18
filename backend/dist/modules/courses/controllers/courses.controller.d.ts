import { CoursesService } from '../services/courses.service';
import { CreateCourseDto } from '../dto/course/create-course.dto';
import { UpdateCourseDto } from '../dto/course/update-course.dto';
import { CourseStatus } from '@prisma/client';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    create(dto: CreateCourseDto, req: any): Promise<any>;
    findAll(status?: CourseStatus, instructorId?: string): Promise<any[]>;
    findMy(req: any): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateCourseDto, req: any): Promise<any>;
    remove(id: string, req: any): Promise<void>;
}
