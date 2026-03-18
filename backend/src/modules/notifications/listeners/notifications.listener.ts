import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../services/notifications.service';

/**
 * NotificationsListener — reacts to domain events and creates Notification
 * records via NotificationsService.
 *
 * Design constraints:
 *   - Does NOT import any other feature module (CoursesModule, LiveModule, etc.)
 *   - All data needed for the notification is carried in the event payload
 *   - Each handler is fire-and-forget: errors are logged, NOT re-thrown
 *     (prevents one bad notification from crashing the emitting flow)
 */
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // ── course.created ──────────────────────────────────────────────────────────

  /**
   * Notifies the instructor that their course was successfully created.
   * Payload: { courseId, instructorId, title, slug }
   */
  @OnEvent('course.created', { async: true })
  async onCourseCreated(payload: {
    courseId: string;
    instructorId: string;
    title: string;
    slug: string;
  }): Promise<void> {
    try {
      await this.notificationsService.notifyUser(
        payload.instructorId,
        NotificationType.COURSE_CREATED,
        'Course created',
        `Your course "${payload.title}" has been created successfully.`,
        { courseId: payload.courseId, slug: payload.slug },
      );
    } catch (err) {
      this.logger.error(`onCourseCreated failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── course.student.enrolled ─────────────────────────────────────────────────

  /**
   * Notifies the course instructor when a new student enrolls.
   * Payload: { courseId, studentId, instructorId, courseTitle }
   */
  @OnEvent('course.student.enrolled', { async: true })
  async onStudentEnrolled(payload: {
    courseId: string;
    studentId: string;
    instructorId: string;
    courseTitle: string;
  }): Promise<void> {
    try {
      await this.notificationsService.notifyUser(
        payload.instructorId,
        NotificationType.STUDENT_ENROLLED,
        'New student enrolled',
        `A new student has enrolled in "${payload.courseTitle}".`,
        { courseId: payload.courseId, studentId: payload.studentId },
      );
    } catch (err) {
      this.logger.error(`onStudentEnrolled failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── live.session.started ────────────────────────────────────────────────────

  /**
   * Notifies the session host that their live session has started.
   * Payload: { sessionId, courseId, hostId, title }
   */
  @OnEvent('live.session.started', { async: true })
  async onLiveSessionStarted(payload: {
    sessionId: string;
    courseId: string;
    hostId: string;
    title: string;
  }): Promise<void> {
    try {
      await this.notificationsService.notifyUser(
        payload.hostId,
        NotificationType.LIVE_SESSION_STARTED,
        'Live session started',
        `Your live session "${payload.title}" is now live!`,
        { sessionId: payload.sessionId, courseId: payload.courseId },
      );
    } catch (err) {
      this.logger.error(`onLiveSessionStarted failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── live.session.ended ──────────────────────────────────────────────────────

  /**
   * Notifies the session host that their live session has ended.
   * Payload: { sessionId, courseId, hostId, title, endedAt }
   */
  @OnEvent('live.session.ended', { async: true })
  async onLiveSessionEnded(payload: {
    sessionId: string;
    courseId: string;
    hostId: string;
    title: string;
    endedAt: Date;
  }): Promise<void> {
    try {
      await this.notificationsService.notifyUser(
        payload.hostId,
        NotificationType.LIVE_SESSION_ENDED,
        'Live session ended',
        `Your live session "${payload.title}" has ended.`,
        {
          sessionId: payload.sessionId,
          courseId: payload.courseId,
          endedAt: payload.endedAt.toISOString(),
        },
      );
    } catch (err) {
      this.logger.error(`onLiveSessionEnded failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ── admin.teacher.assigned ──────────────────────────────────────────────────

  /**
   * Notifies a user that they have been assigned the TEACHER role.
   * Payload: { userId, assignedById }
   */
  @OnEvent('admin.teacher.assigned', { async: true })
  async onTeacherAssigned(payload: {
    userId: string;
    assignedById: string;
  }): Promise<void> {
    try {
      await this.notificationsService.notifyUser(
        payload.userId,
        NotificationType.TEACHER_ASSIGNED,
        'You are now a teacher',
        'An administrator has granted you teacher privileges. You can now create courses and host live sessions.',
        { assignedById: payload.assignedById },
      );
    } catch (err) {
      this.logger.error(`onTeacherAssigned failed: ${(err as Error).message}`, (err as Error).stack);
    }
  }
}
