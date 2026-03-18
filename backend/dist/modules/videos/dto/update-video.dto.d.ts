import { VideoStatus } from '@prisma/client';
export declare class UpdateVideoDto {
    title?: string;
    description?: string;
    mimeType?: string;
    duration?: number;
    status?: VideoStatus;
}
