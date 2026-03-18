import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { VideosService } from '../services/videos.service';
import { CreateVideoDto } from '../dto/create-video.dto';
import { UpdateVideoDto } from '../dto/update-video.dto';
import { RequestUploadUrlDto } from '../dto/request-upload-url.dto';

/**
 * VideosController — video management endpoints.
 *
 * All routes are protected by the global JwtAuthGuard.
 * Authorization (instructor-only mutations) is enforced inside VideosService.
 *
 * Upload flow — client-side direct upload to S3:
 *   POST /videos/upload-url   → { uploadUrl, key, expiresIn }
 *     Client PUTs the file directly to S3 using uploadUrl
 *   POST /videos              → { id, storageKey, status: PROCESSING, … }
 *     Client calls PATCH /videos/:id to set status READY + duration
 *
 * Streaming — all video access is via signed, time-limited URLs:
 *   GET /videos/:id/stream-url → { streamUrl, expiresIn: 300 }
 *     No direct download endpoint exists by design.
 *
 * Endpoints:
 *   POST   /videos/upload-url          — get pre-signed S3 PUT URL (instructor)
 *   POST   /videos                     — register video record after upload (instructor)
 *   GET    /videos/lesson/:lessonId    — list videos for a lesson (any authenticated user)
 *   GET    /videos/:id                 — video metadata (any authenticated user)
 *   GET    /videos/:id/stream-url      — signed streaming URL, TTL 5 min (any auth user)
 *   PATCH  /videos/:id                 — update metadata / status (instructor)
 *   DELETE /videos/:id                 — delete from S3 + DB (instructor)
 */
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // ── Upload flow ────────────────────────────────────────────

  /**
   * Step 1 of the upload flow.
   * Returns a pre-signed S3 PUT URL that the client uses to upload directly.
   */
  @Post('upload-url')
  requestUploadUrl(
    @Body() dto: RequestUploadUrlDto,
    @Req() req: any,
  ) {
    return this.videosService.requestUploadUrl(dto, req.user.sub, req.user.role);
  }

  /**
   * Step 3 of the upload flow (after the client has PUT the file to S3).
   * Registers the video record in the database with status PROCESSING.
   */
  @Post()
  create(@Body() dto: CreateVideoDto, @Req() req: any) {
    return this.videosService.create(dto, req.user.sub, req.user.role);
  }

  // ── Read ───────────────────────────────────────────────────

  @Get('lesson/:lessonId')
  findByLesson(@Param('lessonId') lessonId: string) {
    return this.videosService.findByLesson(lessonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videosService.findById(id);
  }

  /**
   * Returns a signed streaming URL valid for 5 minutes.
   * The client streams the video directly from S3 using this URL.
   * No video bytes flow through the application server.
   */
  @Get(':id/stream-url')
  getStreamUrl(@Param('id') id: string) {
    return this.videosService.getStreamUrl(id);
  }

  // ── Mutate ─────────────────────────────────────────────────

  /**
   * Update metadata or transition status (e.g. PROCESSING → READY).
   * Call after the client has successfully uploaded and can report duration.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @Req() req: any,
  ) {
    return this.videosService.update(id, dto, req.user.sub, req.user.role);
  }

  /**
   * Deletes the S3 object first, then the database record.
   * Idempotent at the DB level — 404 if already deleted.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.videosService.remove(id, req.user.sub, req.user.role);
  }
}
