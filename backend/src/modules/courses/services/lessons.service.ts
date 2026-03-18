import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from '@prisma/client';
import { LessonsRepository } from '../repositories/lessons.repository';
import { CourseModulesRepository } from '../repositories/course-modules.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CreateLessonDto } from '../dto/lesson/create-lesson.dto';
import { UpdateLessonDto } from '../dto/lesson/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonsRepository: LessonsRepository,
    private readonly modulesRepository: CourseModulesRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
  ) {}

  // ── Access guard ─────────────────────────────────────────────────────────────

  /**
   * Students may only access lesson content when their enrollment is ACTIVE.
   * Teachers and admins bypass this check.
   */
  private async assertEnrollmentActive(
    courseId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    if (requesterRole === Role.ADMIN || requesterRole === Role.TEACHER) return;

    const enrollment = await this.enrollmentsRepository.findByUserAndCourse(
      requesterId,
      courseId,
    );

    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new ForbiddenException(
        'You must have an approved (active) enrollment to access course materials',
      );
    }
  }

  // ── Instructor guard ──────────────────────────────────────────────────────────

  private async assertModuleInstructor(
    moduleId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const module = await this.modulesRepository.findById(moduleId);
    if (!module) throw new NotFoundException(`Module #${moduleId} not found`);
    const course = await this.coursesRepository.findById(module.courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the course instructor can manage lessons',
      );
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async create(
    moduleId: string,
    dto: CreateLessonDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    await this.assertModuleInstructor(moduleId, requesterId, requesterRole);
    return this.lessonsRepository.create({
      ...dto,
      module: { connect: { id: moduleId } },
    });
  }

  /**
   * GET /courses/:courseId/modules/:moduleId/lessons
   * Students are blocked unless their enrollment is ACTIVE.
   */
  async findByModule(
    moduleId: string,
    courseId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any[]> {
    await this.assertEnrollmentActive(courseId, requesterId, requesterRole);
    return this.lessonsRepository.findByModule(moduleId);
  }

  /**
   * GET /courses/:courseId/modules/:moduleId/lessons/:id
   * Students are blocked unless their enrollment is ACTIVE.
   */
  async findById(
    id: string,
    courseId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    const lesson = await this.lessonsRepository.findById(id);
    if (!lesson) throw new NotFoundException(`Lesson #${id} not found`);
    await this.assertEnrollmentActive(courseId, requesterId, requesterRole);
    return lesson;
  }

  async update(
    id: string,
    dto: UpdateLessonDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    const lesson = await this.lessonsRepository.findById(id);
    if (!lesson) throw new NotFoundException(`Lesson #${id} not found`);
    await this.assertModuleInstructor(
      lesson.moduleId,
      requesterId,
      requesterRole,
    );
    return this.lessonsRepository.update(id, dto);
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const lesson = await this.lessonsRepository.findById(id);
    if (!lesson) throw new NotFoundException(`Lesson #${id} not found`);
    await this.assertModuleInstructor(
      lesson.moduleId,
      requesterId,
      requesterRole,
    );
    await this.lessonsRepository.delete(id);
  }
}
