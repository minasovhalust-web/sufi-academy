import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CourseModulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return (this.prisma as any).courseModule.create({ data });
  }

  async findByCourse(courseId: string): Promise<any[]> {
    return (this.prisma as any).courseModule.findMany({
      where: { courseId },
      include: { lessons: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return (this.prisma as any).courseModule.findUnique({
      where: { id },
      include: {
        lessons: {
          include: { materials: true },
          orderBy: { order: 'asc' },
        },
        course: true,
      },
    });
  }

  async update(id: string, data: any): Promise<any> {
    return (this.prisma as any).courseModule.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).courseModule.delete({ where: { id } });
  }
}
