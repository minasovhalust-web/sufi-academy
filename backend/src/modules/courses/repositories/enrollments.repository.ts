import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return (this.prisma as any).enrollment.create({ data });
  }

  async findByUser(userId: string): Promise<any[]> {
    return (this.prisma as any).enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            _count: {
              select: { enrollments: true, modules: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findByCourse(courseId: string): Promise<any[]> {
    return (this.prisma as any).enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<any | null> {
    return (this.prisma as any).enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  async update(id: string, data: any): Promise<any> {
    return (this.prisma as any).enrollment.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).enrollment.delete({ where: { id } });
  }
}
