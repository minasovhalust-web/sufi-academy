import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MaterialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return (this.prisma as any).material.create({ data });
  }

  async findByLesson(lessonId: string): Promise<any[]> {
    return (this.prisma as any).material.findMany({ where: { lessonId } });
  }

  async findById(id: string): Promise<any | null> {
    return (this.prisma as any).material.findUnique({
      where: { id },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).material.delete({ where: { id } });
  }
}
