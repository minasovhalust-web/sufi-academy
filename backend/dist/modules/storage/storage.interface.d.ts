export declare const STORAGE_SERVICE = "STORAGE_SERVICE";
export interface UploadResult {
    key: string;
    url: string;
}
export interface PresignedUploadResult {
    uploadUrl: string;
    key: string;
    expiresIn: number;
}
export interface StorageService {
    upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;
    getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;
    getSignedUploadUrl(key: string, mimeType: string, ttlSeconds?: number): Promise<PresignedUploadResult>;
    delete(key: string): Promise<void>;
}
