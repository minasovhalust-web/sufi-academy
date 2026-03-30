import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Course, CourseStatus } from '@prisma/client';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return (this.prisma as any).course.create({ data });
  }

  async findAll(filters?: {
    status?: CourseStatus;
    instructorId?: string;
  }): Promise<any[]> {
    const courses = await (this.prisma as any).course.findMany({
      where: filters,
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { enrollments: true, modules: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (courses.length === 0) return courses;

    // imageUrl lives in the DB but the generated Prisma client may not know about
    // it yet (prisma generate not re-run). Fetch it via raw SQL and merge.
    const ids: string[] = courses.map((c: any) => c.id);
    const rows = await this.prisma.$queryRaw<{ id: string; imageUrl: string | null }[]>(
      Prisma.sql`SELECT "id", "imageUrl" FROM "courses" WHERE "id" IN (${Prisma.join(ids)})`,
    );
    const urlMap = new Map(rows.map((r) => [r.id, r.imageUrl]));
    return courses.map((c: any) => ({ ...c, imageUrl: urlMap.get(c.id) ?? null }));
  }

  async findById(id: string): Promise<any | null> {
    const course = await (this.prisma as any).course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        _count: {
          select: { enrollments: true, modules: true },
        },
      },
    });

    if (!course) return null;

    // Merge imageUrl from raw SQL (same reason as findAll above).
    const rows = await this.prisma.$queryRaw<{ imageUrl: string | null }[]>(
      Prisma.sql`SELECT "imageUrl" FROM "courses" WHERE "id" = ${id}`,
    );
    course.imageUrl = rows[0]?.imageUrl ?? null;
    return course;
  }

  async findBySlug(slug: string): Promise<any | null> {
    return (this.prisma as any).course.findUnique({ where: { slug } });
  }

  async update(id: string, data: any): Promise<any> {
    return (this.prisma as any).course.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).course.delete({ where: { id } });
  }

  /**
   * Update the course cover image URL using a raw SQL query.
   * This bypasses the Prisma generated client so it works even when
   * `prisma generate` hasn't been re-run after adding the imageUrl column.
   */
  async updateImageUrl(id: string, imageUrl: string): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`UPDATE "courses" SET "imageUrl" = ${imageUrl}, "updatedAt" = NOW() WHERE "id" = ${id}`,
    );
  }
}
