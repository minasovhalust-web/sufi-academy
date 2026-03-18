import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Video } from '@prisma/client';
export declare class VideosRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.VideoCreateInput): Promise<Video>;
    findById(id: string): Promise<Video | null>;
    findByLesson(lessonId: string): Promise<Video[]>;
    findByStorageKey(storageKey: string): Promise<Video | null>;
    update(id: string, data: Prisma.VideoUpdateInput): Promise<Video>;
    delete(id: string): Promise<Video>;
    findLessonInstructorId(lessonId: string): Promise<string | null>;
}
