import { Role } from '@prisma/client';
import { CourseModulesRepository } from '../repositories/course-modules.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { CreateCourseModuleDto } from '../dto/module/create-course-module.dto';
import { UpdateCourseModuleDto } from '../dto/module/update-course-module.dto';
export declare class CourseModulesService {
    private readonly modulesRepository;
    private readonly coursesRepository;
    constructor(modulesRepository: CourseModulesRepository, coursesRepository: CoursesRepository);
    private assertInstructor;
    create(courseId: string, dto: CreateCourseModuleDto, requesterId: string, requesterRole: Role): Promise<any>;
    findByCourse(courseId: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    update(id: string, dto: UpdateCourseModuleDto, requesterId: string, requesterRole: Role): Promise<any>;
    remove(id: string, requesterId: string, requesterRole: Role): Promise<void>;
}
