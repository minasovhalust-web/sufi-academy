import { Role } from '@prisma/client';
import { MaterialsRepository } from '../repositories/materials.repository';
import { LessonsRepository } from '../repositories/lessons.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CreateMaterialDto } from '../dto/material/create-material.dto';
export declare class MaterialsService {
    private readonly materialsRepository;
    private readonly lessonsRepository;
    private readonly coursesRepository;
    private readonly enrollmentsRepository;
    constructor(materialsRepository: MaterialsRepository, lessonsRepository: LessonsRepository, coursesRepository: CoursesRepository, enrollmentsRepository: EnrollmentsRepository);
    private assertEnrollmentActiveForLesson;
    private assertLessonInstructor;
    create(lessonId: string, dto: CreateMaterialDto, requesterId: string, requesterRole: Role): Promise<any>;
    findByLesson(lessonId: string, requesterId: string, requesterRole: Role): Promise<any[]>;
    findById(id: string, requesterId: string, requesterRole: Role): Promise<any>;
    remove(id: string, requesterId: string, requesterRole: Role): Promise<void>;
}
