import { Injectable } from '@nestjs/common';
import { ActivityEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CreateActivityLogInput {
  event: ActivityEventType;
  actorId?: string;
  subjectId?: string;
  subjectType?: string;
  metadata?: Record<string, unknown>;
}

export interface DateRange {
  from: Date;
  to: Date;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(input: CreateActivityLogInput) {
    return this.prisma.activityLog.create({
      data: {
        event: input.event,
        actorId: input.actorId,
        subjectId: input.subjectId,
        subjectType: input.subjectType,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /** Total event counts grouped by event type within a date range. */
  async countByEventType(range: DateRange) {
    const result = await this.prisma.activityLog.groupBy({
      by: ['event'],
      where: { createdAt: { gte: range.from, lte: range.to } },
      _count: { event: true },
    });
    return result.map((r) => ({ event: r.event, count: r._count.event }));
  }

  /** Total events per day within a date range (for trend charts). */
  async countByDay(range: DateRange) {
    // Use raw query for date truncation — Prisma doesn't have built-in groupBy date part
    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
      FROM activity_logs
      WHERE "createdAt" >= ${range.from} AND "createdAt" <= ${range.to}
      GROUP BY day
      ORDER BY day ASC
    `;
    return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  }

  /** Per-course event breakdown (enrollments, sessions). */
  async courseStats(range: DateRange) {
    const [enrollments, sessions] = await Promise.all([
      this.prisma.activityLog.count({
        where: {
          event: ActivityEventType.STUDENT_ENROLLED,
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.activityLog.count({
        where: {
          event: ActivityEventType.LIVE_SESSION_STARTED,
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
    ]);
    return { enrollments, liveSessions: sessions };
  }

  /** Per-user activity summary (most active actors). */
  async topActors(range: DateRange, limit = 10) {
    const result = await this.prisma.activityLog.groupBy({
      by: ['actorId'],
      where: {
        actorId: { not: null },
        createdAt: { gte: range.from, lte: range.to },
      },
      _count: { actorId: true },
      orderBy: { _count: { actorId: 'desc' } },
      take: limit,
    });
    return result.map((r) => ({ actorId: r.actorId, count: r._count.actorId }));
  }

  /** Summary totals for all tracked event types within a date range. */
  async summary(range: DateRange) {
    const [
      coursesCreated,
      studentsEnrolled,
      videosUploaded,
      messagesSent,
      sessionsStarted,
      sessionsEnded,
    ] = await Promise.all([
      this.prisma.activityLog.count({
        where: { event: ActivityEventType.COURSE_CREATED, createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.activityLog.count({
        where: { event: ActivityEventType.STUDENT_ENROLLED, createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.activityLog.count({
        where: { event: ActivityEventType.VIDEO_UPLOADED, createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.activityLog.count({
        where: { event: ActivityEventType.CHAT_MESSAGE_SENT, createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.activityLog.count({
        where: { event: ActivityEventType.LIVE_SESSION_STARTED, createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.activityLog.count({
        where: { event: ActivityEventType.LIVE_SESSION_ENDED, createdAt: { gte: range.from, lte: range.to } },
      }),
    ]);
    return {
      coursesCreated,
      studentsEnrolled,
      videosUploaded,
      messagesSent,
      sessionsStarted,
      sessionsEnded,
    };
  }
}
