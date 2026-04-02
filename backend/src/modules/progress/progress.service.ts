import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProgressRepository } from './progress.repository';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepo: ProgressRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Mark a lesson as completed.
   * Verifies the student is actively enrolled in the course that contains the lesson.
   */
  async completeLesson(userId: string, lessonId: string): Promise<{ message: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });

    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.module.courseId;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId, status: 'ACTIVE' },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    await this.progressRepo.complete(userId, lessonId, courseId);
    return { message: 'Lesson marked as completed' };
  }

  /** Remove lesson completion. */
  async uncompleteLesson(userId: string, lessonId: string): Promise<{ message: string }> {
    await this.progressRepo.uncomplete(userId, lessonId);
    return { message: 'Lesson marked as incomplete' };
  }

  /** Get all completed lesson IDs for the current user in a course. */
  async getCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<{ completedLessonIds: string[]; completedCount: number; totalCount: number }> {
    const [completedLessonIds, totalCount] = await Promise.all([
      this.progressRepo.getCompletedLessonIds(userId, courseId),
      this.progressRepo.countLessons(courseId),
    ]);
    return { completedLessonIds, completedCount: completedLessonIds.length, totalCount };
  }

  /**
   * Set lesson progress for a student (teacher / admin use).
   * Skips enrollment check — teacher can mark any enrolled student's lesson.
   */
  async setLessonProgressAsTeacher(
    requesterId: string,
    requesterRole: string,
    lessonId: string,
    targetUserId: string,
    completed: boolean,
  ): Promise<{ message: string }> {
    if (requesterRole !== 'TEACHER' && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('Only teachers and admins can update student progress');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.module.courseId;

    // Verify the teacher is the course instructor (admins bypass this check)
    if (requesterRole === 'TEACHER') {
      const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
      if (!course) throw new NotFoundException('Course not found');
      if (course.instructorId !== requesterId) throw new ForbiddenException('Access denied: not the course instructor');
    }

    if (completed) {
      await this.progressRepo.complete(targetUserId, lessonId, courseId);
      return { message: 'Lesson marked as completed' };
    } else {
      await this.progressRepo.uncomplete(targetUserId, lessonId);
      return { message: 'Lesson marked as incomplete' };
    }
  }

  /** Get per-student progress for a course (teacher / admin). */
  async getStudentProgress(
    courseId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<{ userId: string; firstName: string; lastName: string; avatarUrl: string | null; completedCount: number; totalCount: number; completedLessonIds: string[] }[]> {
    try {
      // Must be course instructor or admin
      if (requesterRole !== 'ADMIN') {
        const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
        if (!course) throw new NotFoundException('Course not found');
        if (course.instructorId !== requesterId) throw new ForbiddenException('Access denied');
      }

      const [students, totalCount] = await Promise.all([
        this.progressRepo.getStudentProgress(courseId),
        this.progressRepo.countLessons(courseId),
      ]);

      // Ensure rows is always a proper array (raw SQL can return non-array on some drivers)
      const rows = Array.isArray(students) ? students : [];
      return rows.map((s) => ({ ...s, totalCount }));
    } catch (err) {
      // Re-throw NestJS HTTP exceptions so they reach the client correctly
      if (err instanceof NotFoundException || err instanceof ForbiddenException) throw err;
      // For unexpected DB/raw-SQL errors return an empty array instead of a 500
      return [];
    }
  }
}
