import { Injectable } from '@nestjs/common';
import {
  EnrollmentStatus,
  LiveParticipant,
  LiveSession,
  ParticipantRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

// ── Compound return types ───────────────────────────────────

export type LiveSessionWithRelations = LiveSession & {
  host: { id: string; firstName: string; lastName: string; email: string };
  course: { id: string; title: string; slug: string };
};

export type LiveParticipantWithUser = LiveParticipant & {
  user: { id: string; firstName: string; lastName: string };
};

/**
 * LiveRepository — sole Prisma access point for LiveModule.
 *
 * Self-contained access control:
 *   Queries Course, Enrollment, and LiveSession tables directly to resolve
 *   instructor/student permissions without importing CoursesModule.
 *
 * Participant upsert strategy:
 *   Re-joining an existing session clears leftAt (allowing re-entry).
 *   A @@unique([sessionId, userId]) constraint ensures one record per user
 *   per session at the DB level.
 */
@Injectable()
export class LiveRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Access control ──────────────────────────────────────────────────────────

  /**
   * Returns true if the user is the course instructor.
   * Used to authorise session creation for TEACHER-role users.
   */
  async checkIsInstructor(courseId: string, userId: string): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    return course?.instructorId === userId;
  }

  /**
   * Returns true if the user is the course instructor OR has an
   * ACTIVE or COMPLETED enrollment in the course.
   * Used to authorise joining a live session.
   */
  async checkCourseAccess(courseId: string, userId: string): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) return false;
    if (course.instructorId === userId) return true;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    return (
      enrollment?.status === EnrollmentStatus.ACTIVE ||
      enrollment?.status === EnrollmentStatus.COMPLETED
    );
  }

  // ── LiveSession CRUD ────────────────────────────────────────────────────────

  async createSession(data: {
    title: string;
    courseId: string;
    hostId: string;
    scheduledAt?: string;
  }): Promise<LiveSessionWithRelations> {
    return this.prisma.liveSession.create({
      data: {
        title: data.title,
        host: { connect: { id: data.hostId } },
        course: { connect: { id: data.courseId } },
      },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async findSessionById(id: string): Promise<LiveSessionWithRelations | null> {
    return this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async findSessionsByCourse(courseId: string): Promise<LiveSession[]> {
    return this.prisma.liveSession.findMany({
      where: { courseId },
      include: {
        host: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { participants: { where: { leftAt: null } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSession(
    id: string,
    data: Prisma.LiveSessionUpdateInput,
  ): Promise<LiveSessionWithRelations> {
    return this.prisma.liveSession.update({
      where: { id },
      data,
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  // ── LiveParticipant CRUD ────────────────────────────────────────────────────

  /**
   * Find-or-create the participant record for a user in a session.
   * Re-joining: clears leftAt so the user appears active again.
   * Uses upsert for safety against concurrent join events.
   */
  async findOrCreateParticipant(
    sessionId: string,
    userId: string,
    role: ParticipantRole,
  ): Promise<LiveParticipantWithUser> {
    return this.prisma.liveParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      create: { sessionId, userId, role },
      update: { leftAt: null, role }, // clear leftAt on re-join; update role if changed
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findParticipant(
    sessionId: string,
    userId: string,
  ): Promise<LiveParticipant | null> {
    return this.prisma.liveParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
  }

  async findActiveParticipants(
    sessionId: string,
  ): Promise<LiveParticipantWithUser[]> {
    return this.prisma.liveParticipant.findMany({
      where: { sessionId, leftAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateParticipant(
    sessionId: string,
    userId: string,
    data: Prisma.LiveParticipantUpdateInput,
  ): Promise<LiveParticipant> {
    return this.prisma.liveParticipant.update({
      where: { sessionId_userId: { sessionId, userId } },
      data,
    });
  }

  /**
   * Mark a participant as having left. Uses updateMany so it's a no-op
   * if the participant is already marked as left (idempotent).
   */
  async markParticipantLeft(sessionId: string, userId: string): Promise<void> {
    await this.prisma.liveParticipant.updateMany({
      where: { sessionId, userId, leftAt: null },
      data: { leftAt: new Date() },
    });
  }
}
