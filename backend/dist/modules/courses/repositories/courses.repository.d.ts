import { PrismaService } from '../../../prisma/prisma.service';
import { CourseStatus } from '@prisma/client';
export declare class CoursesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<any>;
    findAll(filters?: {
        status?: CourseStatus;
        instructorId?: string;
    }): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    findBySlug(slug: string): Promise<any | null>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
}
