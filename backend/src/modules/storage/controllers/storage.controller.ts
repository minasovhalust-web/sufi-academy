import {
  BadRequestException,
  Controller,
  Inject,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE_SERVICE, StorageService } from '../storage.interface';
import { randomUUID } from 'crypto';
import { extname } from 'path';

/** Multer file shape — mirrors Express.Multer.File without requiring @types/multer. */
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** 50 MB — generous limit for voice memos, images, and PDF documents. */
const MAX_BYTES = 50 * 1024 * 1024;

/** Allowed MIME type prefixes / exact types for chat attachments. */
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_MIME_EXACT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isAllowedMime(mime: string): boolean {
  if (ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) return true;
  if (ALLOWED_MIME_EXACT.includes(mime)) return true;
  return false;
}

/**
 * StorageController — generic file upload endpoint for chat attachments.
 *
 * POST /api/v1/storage/upload
 *   Accepts:  multipart/form-data with a "file" field.
 *   Returns:  { key, url, name, mimeType, size }
 *             (wrapped by TransformInterceptor → { success, data: {...}, timestamp })
 *
 * The frontend reads the url from response.data.data.url.
 *
 * Protected by the global JwtAuthGuard (requires a valid Bearer token).
 * File-type validation is enforced here; size limit is enforced by multer.
 *
 * Storage:
 *   Memory storage is configured in StorageModule via MulterModule.register().
 *   FileInterceptor inherits that configuration — no extra storage option needed.
 */
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async uploadFile(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException(
        'No file received. Send a multipart/form-data POST with a field named "file".',
      );
    }

    if (!isAllowedMime(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. ` +
          'Permitted types: images, video, audio, PDF, Word documents.',
      );
    }

    // Build a unique storage key that preserves the original file extension.
    const ext = extname(file.originalname).toLowerCase();
    const key = `chat-uploads/${randomUUID()}${ext}`;

    // Persist the file buffer (S3 or local disk depending on env vars).
    await this.storageService.upload(file.buffer, key, file.mimetype);

    // Generate a long-lived URL so attachments remain accessible in chat history.
    // 30 days for S3 signed URLs; LocalProvider returns a permanent static URL.
    const url = await this.storageService.getSignedUrl(key, 60 * 60 * 24 * 30);

    this.logger.log(
      `Chat upload OK — key=${key}  mime=${file.mimetype}  size=${file.size}B`,
    );

    // TransformInterceptor wraps this as { success: true, data: { key, url, ... }, timestamp }
    // Frontend reads the url from response.data.data.url
    return {
      key,
      url,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
