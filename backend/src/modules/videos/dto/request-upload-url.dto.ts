import { IsString, IsUUID, IsOptional, MinLength } from 'class-validator';

/**
 * RequestUploadUrlDto — request a pre-signed S3 PUT URL.
 *
 * Flow:
 *   1. Client sends this DTO → server returns { uploadUrl, key, expiresIn }
 *   2. Client PUTs the file directly to S3 using uploadUrl
 *   3. Client calls POST /videos with CreateVideoDto (including the returned key)
 */
export class RequestUploadUrlDto {
  @IsString()
  @IsUUID()
  lessonId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  /**
   * MIME type of the video file — e.g. "video/mp4", "video/webm".
   * Must match the Content-Type header the client will use on the PUT request.
   */
  @IsString()
  mimeType: string;
}
