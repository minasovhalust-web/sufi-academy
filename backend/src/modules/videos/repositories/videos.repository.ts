import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Video } from '@prisma/client';

/**
 * VideosRepository — sole Prisma access point for the VideoModule.
 *
 * Ownership check strategy:
 *   Rather than importing CoursesModule (cross-module coupling), this
 *   repository traverses lesson → module → course internally via Prisma
 *   to resolve the course instructorId needed for authorization checks.
 *   This keeps VideoModule fully self-contained.
 */
@Injectable()
export class VideosRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Core CRUD ──────────────────────────────────────────────

  async create(data: Prisma.VideoCreateInput): Promise<Video> {
    return this.prisma.video.create({ data });
  }

  async findById(id: string): Promise<Video | null> {
    return this.prisma.video.findUnique({ where: { id } });
  }

  async findByLesson(lessonId: string): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByStorageKey(storageKey: string): Promise<Video | null> {
    return this.prisma.video.findUnique({ where: { storageKey } });
  }

  async update(id: string, data: Prisma.VideoUpdateInput): Promise<Video> {
    return this.prisma.video.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Video> {
    return this.prisma.video.delete({ where: { id } });
  }

  // ── Ownership helper ───────────────────────────────────────

  /**
   * Resolves the instructorId of the course that owns the given lesson.
   *
   * Used by VideoService to authorize mutations without importing CoursesModule.
   * Returns null if the lesson or its course hierarchy does not exist.
   */
  async findLessonInstructorId(lessonId: string): Promise<string | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: {
          select: {
            course: { select: { instructorId: true } },
          },
        },
      },
    });
    return lesson?.module?.course?.instructorId ?? null;
  }
}
