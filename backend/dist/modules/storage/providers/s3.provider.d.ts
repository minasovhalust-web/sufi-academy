import { ConfigService } from '@nestjs/config';
import { StorageService, UploadResult, PresignedUploadResult } from '../storage.interface';
export declare class S3Provider implements StorageService {
    private readonly config;
    private readonly client;
    private readonly bucket;
    private readonly logger;
    constructor(config: ConfigService);
    upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;
    getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;
    getSignedUploadUrl(key: string, mimeType: string, ttlSeconds?: number): Promise<PresignedUploadResult>;
    delete(key: string): Promise<void>;
}
