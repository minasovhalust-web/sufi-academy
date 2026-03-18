import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from '@prisma/client';
import { MaterialsRepository } from '../repositories/materials.repository';
import { LessonsRepository } from '../repositories/lessons.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CreateMaterialDto } from '../dto/material/create-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly materialsRepository: MaterialsRepository,
    private readonly lessonsRepository: LessonsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
  ) {}

  // ── Access guard ──────────────────────────────────────────────────────────────

  /**
   * Resolves courseId from a lessonId by following lesson → module → course,
   * then asserts the requester has an ACTIVE enrollment (teachers/admins bypass).
   */
  private async assertEnrollmentActiveForLesson(
    lessonId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    if (requesterRole === Role.ADMIN || requesterRole === Role.TEACHER) return;

    const lesson = await this.lessonsRepository.findById(lessonId);
    if (!lesson) throw new NotFoundException(`Lesson #${lessonId} not found`);

    const courseId: string = lesson.module?.courseId ?? lesson.module?.course?.id;
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

  private async assertLessonInstructor(
    lessonId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const lesson = await this.lessonsRepository.findById(lessonId);
    if (!lesson) throw new NotFoundException(`Lesson #${lessonId} not found`);
    const courseId = lesson.module?.courseId;
    const course = await this.coursesRepository.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the course instructor can manage materials',
      );
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async create(
    lessonId: string,
    dto: CreateMaterialDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    await this.assertLessonInstructor(lessonId, requesterId, requesterRole);
    return this.materialsRepository.create({
      ...dto,
      lesson: { connect: { id: lessonId } },
    });
  }

  async findByLesson(
    lessonId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any[]> {
    await this.assertEnrollmentActiveForLesson(lessonId, requesterId, requesterRole);
    return this.materialsRepository.findByLesson(lessonId);
  }

  async findById(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    const material = await this.materialsRepository.findById(id);
    if (!material) throw new NotFoundException(`Material #${id} not found`);
    await this.assertEnrollmentActiveForLesson(material.lessonId, requesterId, requesterRole);
    return material;
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const material = await this.findById(id, requesterId, requesterRole);
    await this.assertLessonInstructor(
      material.lessonId,
      requesterId,
      requesterRole,
    );
    await this.materialsRepository.delete(id);
  }
}
