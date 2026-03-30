import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * ScheduleRepository — raw-SQL only.
 *
 * The "scheduled_lessons" table was added after the last `prisma generate`
 * run, so the generated Prisma Client does not know about it. All queries
 * use $queryRaw / $executeRaw with Prisma.sql tagged templates to stay safe
 * against SQL injection.
 */

export interface RawScheduledLesson {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  courseId: string;
  lessonId: string | null;
  createdAt: Date;
  courseTitle?: string;
}

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string;
    scheduledAt: Date;
    courseId: string;
    lessonId?: string;
  }): Promise<RawScheduledLesson> {
    const id = randomUUID();
    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "scheduled_lessons" ("id","title","description","scheduledAt","courseId","lessonId","createdAt")
        VALUES (
          ${id},
          ${data.title},
          ${data.description ?? null},
          ${data.scheduledAt},
          ${data.courseId},
          ${data.lessonId ?? null},
          NOW()
        )
      `,
    );
    const rows = await this.prisma.$queryRaw<RawScheduledLesson[]>(
      Prisma.sql`SELECT * FROM "scheduled_lessons" WHERE "id" = ${id}`,
    );
    return rows[0];
  }

  async findByCourse(courseId: string): Promise<RawScheduledLesson[]> {
    return this.prisma.$queryRaw<RawScheduledLesson[]>(
      Prisma.sql`
        SELECT * FROM "scheduled_lessons"
        WHERE "courseId" = ${courseId}
        ORDER BY "scheduledAt" ASC
      `,
    );
  }

  /**
   * Upcoming lessons for a user — joins through active enrollments.
   * Returns all scheduled lessons whose course the user is enrolled in
   * (status = 'ACTIVE'), sorted by scheduledAt ASC.
   */
  async findUpcomingForUser(userId: string): Promise<RawScheduledLesson[]> {
    return this.prisma.$queryRaw<RawScheduledLesson[]>(
      Prisma.sql`
        SELECT sl.*, c."title" AS "courseTitle"
        FROM "scheduled_lessons" sl
        JOIN "courses" c ON c."id" = sl."courseId"
        JOIN "enrollments" e ON e."courseId" = sl."courseId"
          AND e."userId" = ${userId}
          AND e."status" = 'ACTIVE'
        ORDER BY sl."scheduledAt" ASC
      `,
    );
  }

  /**
   * All lessons for teacher — all scheduled lessons across courses where
   * the user is the instructor, sorted by scheduledAt ASC.
   */
  async findForInstructor(instructorId: string): Promise<RawScheduledLesson[]> {
    return this.prisma.$queryRaw<RawScheduledLesson[]>(
      Prisma.sql`
        SELECT sl.*, c."title" AS "courseTitle"
        FROM "scheduled_lessons" sl
        JOIN "courses" c ON c."id" = sl."courseId"
          AND c."instructorId" = ${instructorId}
        ORDER BY sl."scheduledAt" ASC
      `,
    );
  }

  async findById(id: string): Promise<RawScheduledLesson | null> {
    const rows = await this.prisma.$queryRaw<RawScheduledLesson[]>(
      Prisma.sql`SELECT * FROM "scheduled_lessons" WHERE "id" = ${id}`,
    );
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`DELETE FROM "scheduled_lessons" WHERE "id" = ${id}`,
    );
  }
}
