import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageService,
  UploadResult,
  PresignedUploadResult,
} from '../storage.interface';

/**
 * S3Provider — concrete implementation of StorageService backed by AWS S3.
 *
 * Compatible with any S3-compatible storage (MinIO, Cloudflare R2, etc.).
 * Set STORAGE_ENDPOINT to a custom URL for non-AWS providers.
 * Set STORAGE_FORCE_PATH_STYLE=true for MinIO.
 *
 * Required environment variables:
 *   STORAGE_BUCKET         — bucket name
 *   STORAGE_ACCESS_KEY     — access key ID
 *   STORAGE_SECRET_KEY     — secret access key
 *
 * Optional environment variables:
 *   STORAGE_REGION         — AWS region (default: us-east-1)
 *   STORAGE_ENDPOINT       — custom endpoint URL (for MinIO / R2)
 *   STORAGE_FORCE_PATH_STYLE — "true" for path-style addressing (MinIO)
 */
@Injectable()
export class S3Provider implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3Provider.name);

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('STORAGE_BUCKET');

    const endpoint = this.config.get<string>('STORAGE_ENDPOINT');
    const forcePathStyle =
      this.config.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true';

    this.client = new S3Client({
      region: this.config.get<string>('STORAGE_REGION', 'us-east-1'),
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('STORAGE_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('STORAGE_SECRET_KEY'),
      },
      forcePathStyle, // required for MinIO path-style addressing
    });
  }

  // ── Public methods ─────────────────────────────────────────

  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    this.logger.log(`Uploaded: ${key}`);
    const url = await this.getSignedUrl(key);
    return { key, url };
  }

  async getSignedUrl(key: string, ttlSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: ttlSeconds },
    );
  }

  async getSignedUploadUrl(
    key: string,
    mimeType: string,
    ttlSeconds = 3600,
  ): Promise<PresignedUploadResult> {
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      }),
      { expiresIn: ttlSeconds },
    );
    return { uploadUrl, key, expiresIn: ttlSeconds };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`Deleted: ${key}`);
  }
}
