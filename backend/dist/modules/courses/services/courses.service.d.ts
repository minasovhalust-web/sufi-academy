import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { CoursesRepository } from '../repositories/courses.repository';
import { CreateCourseDto } from '../dto/course/create-course.dto';
import { UpdateCourseDto } from '../dto/course/update-course.dto';
export declare class CoursesService {
    private readonly coursesRepository;
    private readonly eventEmitter;
    constructor(coursesRepository: CoursesRepository, eventEmitter: EventEmitter2);
    create(dto: CreateCourseDto, instructorId: string): Promise<any>;
    findAll(filters?: {
        status?: any;
        instructorId?: string;
    }): Promise<any[]>;
    findMy(instructorId: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    update(id: string, dto: UpdateCourseDto, requesterId: string, requesterRole: Role): Promise<any>;
    remove(id: string, requesterId: string, requesterRole: Role): Promise<void>;
}
