import { ConfigService } from '@nestjs/config';
import { StorageService, UploadResult, PresignedUploadResult } from '../storage.interface';
export declare class LocalProvider implements StorageService {
    private readonly config;
    private readonly uploadDir;
    private readonly baseUrl;
    private readonly logger;
    constructor(config: ConfigService);
    upload(buffer: Buffer, key: string, _mimeType: string): Promise<UploadResult>;
    getSignedUrl(key: string, _ttlSeconds?: number): Promise<string>;
    getSignedUploadUrl(key: string, _mimeType: string, _ttlSeconds?: number): Promise<PresignedUploadResult>;
    delete(key: string): Promise<void>;
}
