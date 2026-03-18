import { PrismaService } from '../../../prisma/prisma.service';
export declare class CourseModulesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<any>;
    findByCourse(courseId: string): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
}
