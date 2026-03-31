import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * ProgressRepository — raw-SQL only.
 *
 * The "lesson_progress" table was added after the last `prisma generate`
 * run, so the generated Prisma Client does not know about it. All queries
 * use $queryRaw / $executeRaw with Prisma.sql tagged templates.
 */

export interface RawLessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  completedAt: Date;
}

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Mark a lesson as completed. Ignores duplicates (ON CONFLICT DO NOTHING). */
  async complete(userId: string, lessonId: string, courseId: string): Promise<void> {
    const id = randomUUID();
    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "lesson_progress" ("id","userId","lessonId","courseId","completedAt")
        VALUES (${id}, ${userId}, ${lessonId}, ${courseId}, NOW())
        ON CONFLICT ("userId","lessonId") DO NOTHING
      `,
    );
  }

  /** Remove a lesson completion (un-check). */
  async uncomplete(userId: string, lessonId: string): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`
        DELETE FROM "lesson_progress"
        WHERE "userId" = ${userId} AND "lessonId" = ${lessonId}
      `,
    );
  }

  /** Get all completed lesson IDs for a user in a course. */
  async getCompletedLessonIds(userId: string, courseId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ lessonId: string }[]>(
      Prisma.sql`
        SELECT "lessonId"
        FROM "lesson_progress"
        WHERE "userId" = ${userId} AND "courseId" = ${courseId}
      `,
    );
    return rows.map((r) => r.lessonId);
  }

  /**
   * Get per-student progress for a course (teacher view).
   * Returns rows: { userId, firstName, lastName, avatarUrl, completedCount }
   */
  async getStudentProgress(
    courseId: string,
  ): Promise<{ userId: string; firstName: string; lastName: string; avatarUrl: string | null; completedCount: number }[]> {
    const rows = await this.prisma.$queryRaw<
      { userId: string; firstName: string; lastName: string; avatarUrl: string | null; completedCount: bigint }[]
    >(
      Prisma.sql`
        SELECT
          u."id"         AS "userId",
          u."firstName",
          u."lastName",
          u."avatarUrl",
          COUNT(lp."id") AS "completedCount"
        FROM "enrollments" e
        JOIN "users" u ON u."id" = e."userId"
        LEFT JOIN "lesson_progress" lp ON lp."userId" = e."userId" AND lp."courseId" = ${courseId}
        WHERE e."courseId" = ${courseId} AND e."status" = 'ACTIVE'
        GROUP BY u."id", u."firstName", u."lastName", u."avatarUrl"
        ORDER BY u."firstName", u."lastName"
      `,
    );
    return rows.map((r) => ({ ...r, completedCount: Number(r.completedCount) }));
  }

  /** Count total lessons in a course. */
  async countLessons(courseId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(l."id") AS count
        FROM "lessons" l
        JOIN "course_modules" m ON m."id" = l."moduleId"
        WHERE m."courseId" = ${courseId}
      `,
    );
    return Number(rows[0]?.count ?? 0);
  }

  /** Get completed lesson count for a user across a list of courses. */
  async getCompletedCountByCourses(
    userId: string,
    courseIds: string[],
  ): Promise<{ courseId: string; completedCount: number }[]> {
    if (courseIds.length === 0) return [];
    const rows = await this.prisma.$queryRaw<{ courseId: string; completedCount: bigint }[]>(
      Prisma.sql`
        SELECT "courseId", COUNT(*) AS "completedCount"
        FROM "lesson_progress"
        WHERE "userId" = ${userId} AND "courseId" = ANY(${courseIds}::uuid[])
        GROUP BY "courseId"
      `,
    );
    return rows.map((r) => ({ courseId: r.courseId, completedCount: Number(r.completedCount) }));
  }

  /** Get completed lessons per course for the current user (single query for dashboard). */
  async getProgressForCourses(
    userId: string,
    courseIds: string[],
  ): Promise<{ courseId: string; completedCount: number; totalCount: number }[]> {
    if (courseIds.length === 0) return [];
    // total lessons per course
    const totals = await this.prisma.$queryRaw<{ courseId: string; total: bigint }[]>(
      Prisma.sql`
        SELECT m."courseId", COUNT(l."id") AS total
        FROM "lessons" l
        JOIN "course_modules" m ON m."id" = l."moduleId"
        WHERE m."courseId" = ANY(${courseIds}::uuid[])
        GROUP BY m."courseId"
      `,
    );
    const completed = await this.getCompletedCountByCourses(userId, courseIds);

    return courseIds.map((courseId) => {
      const t = totals.find((r) => r.courseId === courseId);
      const c = completed.find((r) => r.courseId === courseId);
      return {
        courseId,
        completedCount: c?.completedCount ?? 0,
        totalCount: t ? Number(t.total) : 0,
      };
    });
  }
}
