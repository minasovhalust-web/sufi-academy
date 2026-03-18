import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role, Video } from '@prisma/client';
import { VideosRepository } from '../repositories/videos.repository';
import { StorageService, PresignedUploadResult } from '../../storage/storage.interface';
import { CreateVideoDto } from '../dto/create-video.dto';
import { UpdateVideoDto } from '../dto/update-video.dto';
import { RequestUploadUrlDto } from '../dto/request-upload-url.dto';
export declare class VideosService {
    private readonly videosRepository;
    private readonly storageService;
    private readonly eventEmitter;
    constructor(videosRepository: VideosRepository, storageService: StorageService, eventEmitter: EventEmitter2);
    requestUploadUrl(dto: RequestUploadUrlDto, requesterId: string, requesterRole: Role): Promise<PresignedUploadResult>;
    create(dto: CreateVideoDto, requesterId: string, requesterRole: Role): Promise<Video>;
    findByLesson(lessonId: string): Promise<Video[]>;
    findById(id: string): Promise<Video>;
    getStreamUrl(id: string): Promise<{
        streamUrl: string;
        expiresIn: number;
    }>;
    update(id: string, dto: UpdateVideoDto, requesterId: string, requesterRole: Role): Promise<Video>;
    remove(id: string, requesterId: string, requesterRole: Role): Promise<void>;
    private assertLessonInstructor;
}
