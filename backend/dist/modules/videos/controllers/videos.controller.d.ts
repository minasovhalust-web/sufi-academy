import { VideosService } from '../services/videos.service';
import { CreateVideoDto } from '../dto/create-video.dto';
import { UpdateVideoDto } from '../dto/update-video.dto';
import { RequestUploadUrlDto } from '../dto/request-upload-url.dto';
export declare class VideosController {
    private readonly videosService;
    constructor(videosService: VideosService);
    requestUploadUrl(dto: RequestUploadUrlDto, req: any): Promise<import("../../storage/storage.interface").PresignedUploadResult>;
    create(dto: CreateVideoDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        duration: number | null;
        lessonId: string;
        storageKey: string;
        mimeType: string;
    }>;
    findByLesson(lessonId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        duration: number | null;
        lessonId: string;
        storageKey: string;
        mimeType: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        duration: number | null;
        lessonId: string;
        storageKey: string;
        mimeType: string;
    }>;
    getStreamUrl(id: string): Promise<{
        streamUrl: string;
        expiresIn: number;
    }>;
    update(id: string, dto: UpdateVideoDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        duration: number | null;
        lessonId: string;
        storageKey: string;
        mimeType: string;
    }>;
    remove(id: string, req: any): Promise<void>;
}
