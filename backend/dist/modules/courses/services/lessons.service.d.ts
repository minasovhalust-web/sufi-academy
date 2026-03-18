import { Role } from '@prisma/client';
import { LessonsRepository } from '../repositories/lessons.repository';
import { CourseModulesRepository } from '../repositories/course-modules.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CreateLessonDto } from '../dto/lesson/create-lesson.dto';
import { UpdateLessonDto } from '../dto/lesson/update-lesson.dto';
export declare class LessonsService {
    private readonly lessonsRepository;
    private readonly modulesRepository;
    private readonly coursesRepository;
    private readonly enrollmentsRepository;
    constructor(lessonsRepository: LessonsRepository, modulesRepository: CourseModulesRepository, coursesRepository: CoursesRepository, enrollmentsRepository: EnrollmentsRepository);
    private assertEnrollmentActive;
    private assertModuleInstructor;
    create(moduleId: string, dto: CreateLessonDto, requesterId: string, requesterRole: Role): Promise<any>;
    findByModule(moduleId: string, courseId: string, requesterId: string, requesterRole: Role): Promise<any[]>;
    findById(id: string, courseId: string, requesterId: string, requesterRole: Role): Promise<any>;
    update(id: string, dto: UpdateLessonDto, requesterId: string, requesterRole: Role): Promise<any>;
    remove(id: string, requesterId: string, requesterRole: Role): Promise<void>;
}
