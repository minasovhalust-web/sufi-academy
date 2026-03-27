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
    return (this.prisma as any).course.findMany({
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
  }

  async findById(id: string): Promise<any | null> {
    return (this.prisma as any).course.findUnique({
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
