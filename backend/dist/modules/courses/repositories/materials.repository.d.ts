import { PrismaService } from '../../../prisma/prisma.service';
export declare class MaterialsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<any>;
    findByLesson(lessonId: string): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    delete(id: string): Promise<void>;
}
