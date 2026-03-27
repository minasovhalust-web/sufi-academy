import { CoursesService } from '../services/courses.service';
import { CreateCourseDto } from '../dto/course/create-course.dto';
import { UpdateCourseDto } from '../dto/course/update-course.dto';
import { CourseStatus } from '@prisma/client';
import { StorageService } from '../../storage/storage.interface';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class CoursesController {
    private readonly coursesService;
    private readonly storageService;
    constructor(coursesService: CoursesService, storageService: StorageService);
    create(dto: CreateCourseDto, req: any): Promise<any>;
    findAll(status?: CourseStatus, instructorId?: string): Promise<any[]>;
    findMy(req: any): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateCourseDto, req: any): Promise<any>;
    uploadImage(id: string, file: MulterFile, req: any): Promise<{
        imageUrl: string;
    }>;
    remove(id: string, req: any): Promise<void>;
}
export {};
