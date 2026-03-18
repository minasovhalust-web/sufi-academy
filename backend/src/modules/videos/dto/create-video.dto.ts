import { IsString, IsUUID, IsOptional, IsInt, MinLength, Min } from 'class-validator';

/**
 * CreateVideoDto — register a video record after the client has uploaded
 * the file directly to S3.
 *
 * The storageKey is returned by the /videos/upload-url endpoint.
 */
export class CreateVideoDto {
  @IsString()
  @IsUUID()
  lessonId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** S3 object key returned from the upload-url request. */
  @IsString()
  storageKey: string;

  /** MIME type — must match the value used during the upload. */
  @IsString()
  mimeType: string;

  /** Video duration in seconds (optional; can be filled after transcoding). */
  @IsInt()
  @IsOptional()
  @Min(1)
  duration?: number;
}
