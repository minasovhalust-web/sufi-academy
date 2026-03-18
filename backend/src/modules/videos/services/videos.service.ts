import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role, Video } from '@prisma/client';
import { VideosRepository } from '../repositories/videos.repository';
import {
  STORAGE_SERVICE,
  StorageService,
  PresignedUploadResult,
} from '../../storage/storage.interface';
import { CreateVideoDto } from '../dto/create-video.dto';
import { UpdateVideoDto } from '../dto/update-video.dto';
import { RequestUploadUrlDto } from '../dto/request-upload-url.dto';

/** Streaming URL TTL — 5 minutes, matches security requirement. */
const STREAM_URL_TTL = 300;

/** Upload URL TTL — 1 hour, enough for large video files. */
const UPLOAD_URL_TTL = 3600;

/**
 * VideosService — business logic for video management.
 *
 * Upload flow (client-side direct upload):
 *   1. requestUploadUrl() → returns a pre-signed S3 PUT URL
 *   2. Client uploads the file directly to S3 (zero server bandwidth)
 *   3. create() → registers the video record in the database
 *   4. Client calls update() to set status READY and duration
 *
 * Streaming:
 *   - getStreamUrl() returns a signed URL valid for STREAM_URL_TTL seconds
 *   - No direct file download endpoint — all access is time-limited
 */
@Injectable()
export class VideosService {
  constructor(
    private readonly videosRepository: VideosRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Upload flow ────────────────────────────────────────────

  async requestUploadUrl(
    dto: RequestUploadUrlDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<PresignedUploadResult> {
    await this.assertLessonInstructor(dto.lessonId, requesterId, requesterRole);

    // Build a deterministic, URL-safe S3 key
    const slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const key = `videos/${dto.lessonId}/${Date.now()}-${slug}`;

    return this.storageService.getSignedUploadUrl(
      key,
      dto.mimeType,
      UPLOAD_URL_TTL,
    );
  }

  async create(
    dto: CreateVideoDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<Video> {
    await this.assertLessonInstructor(dto.lessonId, requesterId, requesterRole);
    const video = await this.videosRepository.create({
      title: dto.title,
      description: dto.description,
      storageKey: dto.storageKey,
      mimeType: dto.mimeType,
      duration: dto.duration,
      lesson: { connect: { id: dto.lessonId } },
    });
    this.eventEmitter.emit('video.uploaded', {
      videoId: video.id,
      lessonId: dto.lessonId,
      instructorId: requesterId,
      title: video.title,
    });
    return video;
  }

  // ── Read ───────────────────────────────────────────────────

  async findByLesson(lessonId: string): Promise<Video[]> {
    return this.videosRepository.findByLesson(lessonId);
  }

  async findById(id: string): Promise<Video> {
    const video = await this.videosRepository.findById(id);
    if (!video) throw new NotFoundException(`Video #${id} not found`);
    return video;
  }

  /**
   * Returns a time-limited signed URL for streaming the video.
   * Any authenticated user who knows the video ID can stream it.
   * The URL expires after STREAM_URL_TTL seconds (5 minutes).
   */
  async getStreamUrl(
    id: string,
  ): Promise<{ streamUrl: string; expiresIn: number }> {
    const video = await this.findById(id);
    const streamUrl = await this.storageService.getSignedUrl(
      video.storageKey,
      STREAM_URL_TTL,
    );
    return { streamUrl, expiresIn: STREAM_URL_TTL };
  }

  // ── Mutate ─────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateVideoDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<Video> {
    const video = await this.findById(id);
    await this.assertLessonInstructor(video.lessonId, requesterId, requesterRole);
    return this.videosRepository.update(id, dto);
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const video = await this.findById(id);
    await this.assertLessonInstructor(video.lessonId, requesterId, requesterRole);
    // Delete from S3 first; if it fails the DB record is preserved for retry
    await this.storageService.delete(video.storageKey);
    await this.videosRepository.delete(id);
  }

  // ── Private helpers ────────────────────────────────────────

  /**
   * Verifies the requester is the course instructor (or an ADMIN).
   * Traverses lesson → module → course without importing CoursesModule.
   */
  private async assertLessonInstructor(
    lessonId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const instructorId =
      await this.videosRepository.findLessonInstructorId(lessonId);
    if (instructorId === null) {
      throw new NotFoundException(`Lesson #${lessonId} not found`);
    }
    if (instructorId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the course instructor can manage videos for this lesson',
      );
    }
  }
}
