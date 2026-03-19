import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  StorageService,
  UploadResult,
  PresignedUploadResult,
} from '../storage.interface';

/**
 * LocalProvider — dev-only StorageService that saves files to ./uploads/.
 *
 * Used automatically when STORAGE_BUCKET is not configured.
 * Files are served as static assets at /uploads/<filename>.
 *
 * NOT suitable for production or multi-instance deployments.
 * Switch to S3Provider by setting STORAGE_BUCKET in .env.
 */
@Injectable()
export class LocalProvider implements StorageService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(LocalProvider.name);

  constructor(private readonly config: ConfigService) {
    // Directory relative to the NestJS process cwd (i.e. the backend root)
    this.uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }

    const port = this.config.get<string>('APP_PORT', '4000');
    this.baseUrl = `http://95.179.187.108:${port}`;
    this.logger.warn(
      'LocalProvider active — files saved to ./uploads/. Set STORAGE_BUCKET to use S3.',
    );
  }

  async upload(
    buffer: Buffer,
    key: string,
    _mimeType: string,
  ): Promise<UploadResult> {
    // Use only the filename part of the key to avoid nested directories
    const filename = key.replace(/\//g, '_');
    const filePath = join(this.uploadDir, filename);
    writeFileSync(filePath, buffer);
    this.logger.log(`LocalProvider: saved ${filename}`);
    const url = `${this.baseUrl}/uploads/${filename}`;
    return { key, url };
  }

  async getSignedUrl(key: string, _ttlSeconds?: number): Promise<string> {
    const filename = key.replace(/\//g, '_');
    return `${this.baseUrl}/uploads/${filename}`;
  }

  async getSignedUploadUrl(
    key: string,
    _mimeType: string,
    _ttlSeconds?: number,
  ): Promise<PresignedUploadResult> {
    // Local provider does not support direct client uploads —
    // callers should fall back to the server-side upload() method instead.
    const filename = key.replace(/\//g, '_');
    return {
      uploadUrl: `${this.baseUrl}/api/v1/storage/upload`,
      key: filename,
      expiresIn: 3600,
    };
  }

  async delete(key: string): Promise<void> {
    const filename = key.replace(/\//g, '_');
    const filePath = join(this.uploadDir, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      this.logger.log(`LocalProvider: deleted ${filename}`);
    }
  }
}
