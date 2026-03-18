import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LessonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return (this.prisma as any).lesson.create({ data });
  }

  async findByModule(moduleId: string): Promise<any[]> {
    return (this.prisma as any).lesson.findMany({
      where: { moduleId },
      include: { materials: true },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return (this.prisma as any).lesson.findUnique({
      where: { id },
      include: {
        materials: true,
        module: {
          include: { course: true },
        },
      },
    });
  }

  async update(id: string, data: any): Promise<any> {
    return (this.prisma as any).lesson.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).lesson.delete({ where: { id } });
  }
}
