import { PrismaService } from '../../../prisma/prisma.service';
export declare class EnrollmentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<any>;
    findByUser(userId: string): Promise<any[]>;
    findByCourse(courseId: string): Promise<any[]>;
    findByUserAndCourse(userId: string, courseId: string): Promise<any | null>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
}
