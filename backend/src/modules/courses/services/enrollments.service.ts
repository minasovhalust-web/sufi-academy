import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { CreateEnrollmentDto } from '../dto/enrollment/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/enrollment/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async enroll(dto: CreateEnrollmentDto, userId: string): Promise<any> {
    const course = await this.coursesRepository.findById(dto.courseId);
    if (!course) {
      throw new NotFoundException(`Course #${dto.courseId} not found`);
    }
    const existing = await this.enrollmentsRepository.findByUserAndCourse(
      userId,
      dto.courseId,
    );
    if (existing) {
      throw new ConflictException('You are already enrolled in this course');
    }
    const enrollment = await this.enrollmentsRepository.create({
      status: 'PENDING',
      user: { connect: { id: userId } },
      course: { connect: { id: dto.courseId } },
    });
    this.eventEmitter.emit('course.student.enrolled', {
      courseId: course.id,
      studentId: userId,
      instructorId: course.instructorId,
      courseTitle: course.title,
    });
    return enrollment;
  }

  async findMyEnrollments(userId: string): Promise<any[]> {
    return this.enrollmentsRepository.findByUser(userId);
  }

  async findByCourse(
    courseId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any[]> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) throw new NotFoundException(`Course #${courseId} not found`);
    if (course.instructorId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the course instructor can view the enrollment list',
      );
    }
    return this.enrollmentsRepository.findByCourse(courseId);
  }

  async updateProgress(
    courseId: string,
    userId: string,
    dto: UpdateEnrollmentDto,
  ): Promise<any> {
    const enrollment = await this.enrollmentsRepository.findByUserAndCourse(
      userId,
      courseId,
    );
    if (!enrollment) {
      throw new NotFoundException(
        `No enrollment found for course #${courseId}`,
      );
    }
    return this.enrollmentsRepository.update(enrollment.id, dto);
  }

  async unenroll(courseId: string, userId: string): Promise<void> {
    const enrollment = await this.enrollmentsRepository.findByUserAndCourse(
      userId,
      courseId,
    );
    if (!enrollment) {
      throw new NotFoundException(
        `No enrollment found for course #${courseId}`,
      );
    }
    await this.enrollmentsRepository.delete(enrollment.id);
  }
}
