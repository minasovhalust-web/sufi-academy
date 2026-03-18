import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityEventType } from '@prisma/client';
import { AnalyticsService } from '../services/analytics.service';

/**
 * AnalyticsListener — reacts to domain events and writes ActivityLog records.
 *
 * Design constraints:
 *   - Does NOT import any other feature module.
 *   - All context needed is carried in event payloads.
 *   - Errors are logged and swallowed — analytics must never block core flows.
 */
@Injectable()
export class AnalyticsListener {
  private readonly logger = new Logger(AnalyticsListener.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── course.created ──────────────────────────────────────────────────────────

  @OnEvent('course.created', { async: true })
  async onCourseCreated(payload: {
    courseId: string;
    instructorId: string;
    title: string;
    slug: string;
  }): Promise<void> {
    try {
      await this.analyticsService.log(
        ActivityEventType.COURSE_CREATED,
        payload.instructorId,
        payload.courseId,
        'Course',
        { title: payload.title, slug: payload.slug },
      );
    } catch (err) {
      this.logger.error(`onCourseCreated failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── course.student.enrolled ─────────────────────────────────────────────────

  @OnEvent('course.student.enrolled', { async: true })
  async onStudentEnrolled(payload: {
    courseId: string;
    studentId: string;
    instructorId: string;
    courseTitle: string;
  }): Promise<void> {
    try {
      await this.analyticsService.log(
        ActivityEventType.STUDENT_ENROLLED,
        payload.studentId,
        payload.courseId,
        'Course',
        { courseTitle: payload.courseTitle, instructorId: payload.instructorId },
      );
    } catch (err) {
      this.logger.error(`onStudentEnrolled failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── video.uploaded ──────────────────────────────────────────────────────────

  @OnEvent('video.uploaded', { async: true })
  async onVideoUploaded(payload: {
    videoId: string;
    lessonId: string;
    instructorId: string;
    title: string;
  }): Promise<void> {
    try {
      await this.analyticsService.log(
        ActivityEventType.VIDEO_UPLOADED,
        payload.instructorId,
        payload.videoId,
        'Video',
        { lessonId: payload.lessonId, title: payload.title },
      );
    } catch (err) {
      this.logger.error(`onVideoUploaded failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── chat.message.sent ───────────────────────────────────────────────────────

  @OnEvent('chat.message.sent', { async: true })
  async onChatMessageSent(payload: {
    messageId: string;
    roomId: string;
    courseId: string;
    senderId: string;
  }): Promise<void> {
    try {
      await this.analyticsService.log(
        ActivityEventType.CHAT_MESSAGE_SENT,
        payload.senderId,
        payload.messageId,
        'ChatMessage',
        { roomId: payload.roomId, courseId: payload.courseId },
      );
    } catch (err) {
      this.logger.error(`onChatMessageSent failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── live.session.started ────────────────────────────────────────────────────

  @OnEvent('live.session.started', { async: true })
  async onLiveSessionStarted(payload: {
    sessionId: string;
    courseId: string;
    hostId: string;
    title: string;
  }): Promise<void> {
    try {
      await this.analyticsService.log(
        ActivityEventType.LIVE_SESSION_STARTED,
        payload.hostId,
        payload.sessionId,
        'LiveSession',
        { courseId: payload.courseId, title: payload.title },
      );
    } catch (err) {
      this.logger.error(`onLiveSessionStarted failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── live.session.ended ──────────────────────────────────────────────────────

  @OnEvent('live.session.ended', { async: true })
  async onLiveSessionEnded(payload: {
    sessionId: string;
    courseId: string;
    hostId: string;
    title: string;
    endedAt: Date;
  }): Promise<void> {
    try {
      await this.analyticsService.log(
        ActivityEventType.LIVE_SESSION_ENDED,
        payload.hostId,
        payload.sessionId,
        'LiveSession',
        {
          courseId: payload.courseId,
          title: payload.title,
          endedAt: payload.endedAt.toISOString(),
        },
      );
    } catch (err) {
      this.logger.error(`onLiveSessionEnded failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }
}
