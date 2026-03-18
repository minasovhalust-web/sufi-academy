import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { VideoStatus } from '@prisma/client';

/**
 * UpdateVideoDto — update video metadata or status.
 *
 * storageKey and lessonId are intentionally excluded:
 *   - storageKey: immutable after upload (changing it would orphan the S3 object)
 *   - lessonId: changing the lesson a video belongs to is not supported
 */
export class UpdateVideoDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  /** Update duration once the client or a worker has measured it. */
  @IsInt()
  @IsOptional()
  @Min(1)
  duration?: number;

  /** Transition video status (e.g. PROCESSING → READY after upload confirmation). */
  @IsEnum(VideoStatus)
  @IsOptional()
  status?: VideoStatus;
}
