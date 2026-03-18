import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { CreateEnrollmentDto } from '../dto/enrollment/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/enrollment/update-enrollment.dto';
export declare class EnrollmentsService {
    private readonly enrollmentsRepository;
    private readonly coursesRepository;
    private readonly eventEmitter;
    constructor(enrollmentsRepository: EnrollmentsRepository, coursesRepository: CoursesRepository, eventEmitter: EventEmitter2);
    enroll(dto: CreateEnrollmentDto, userId: string): Promise<any>;
    findMyEnrollments(userId: string): Promise<any[]>;
    findByCourse(courseId: string, requesterId: string, requesterRole: Role): Promise<any[]>;
    updateProgress(courseId: string, userId: string, dto: UpdateEnrollmentDto): Promise<any>;
    unenroll(courseId: string, userId: string): Promise<void>;
}
