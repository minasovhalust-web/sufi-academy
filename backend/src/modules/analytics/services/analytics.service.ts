import { Injectable } from '@nestjs/common';
import { ActivityEventType } from '@prisma/client';
import {
  AnalyticsRepository,
  CreateActivityLogInput,
  DateRange,
} from '../repositories/analytics.repository';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

/** Default lookback window when no date range is provided: 30 days. */
const DEFAULT_LOOKBACK_DAYS = 30;

/**
 * AnalyticsService — business logic for activity tracking and reporting.
 *
 * Rules:
 *   - All write paths come from AnalyticsListener (via EventEmitter2 events).
 *   - All read paths are ADMIN-only (enforced in the controller via @Roles).
 *   - Never imports Prisma — all DB access goes through AnalyticsRepository.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  // ── Called by AnalyticsListener ──────────────────────────────────────────────

  async logEvent(input: CreateActivityLogInput): Promise<void> {
    await this.analyticsRepository.createLog(input);
  }

  // ── REST endpoints (ADMIN only) ──────────────────────────────────────────────

  async getSummary(query: AnalyticsQueryDto) {
    const range = this.toDateRange(query);
    const [summary, trend] = await Promise.all([
      this.analyticsRepository.summary(range),
      this.analyticsRepository.countByDay(range),
    ]);
    return { range: { from: range.from, to: range.to }, summary, trend };
  }

  async getCourseStats(query: AnalyticsQueryDto) {
    const range = this.toDateRange(query);
    return {
      range: { from: range.from, to: range.to },
      ...(await this.analyticsRepository.courseStats(range)),
    };
  }

  async getUserStats(query: AnalyticsQueryDto) {
    const range = this.toDateRange(query);
    const topActors = await this.analyticsRepository.topActors(range);
    return { range: { from: range.from, to: range.to }, topActors };
  }

  // ── Convenience helpers used by listener ────────────────────────────────────

  async log(
    event: ActivityEventType,
    actorId?: string,
    subjectId?: string,
    subjectType?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.logEvent({ event, actorId, subjectId, subjectType, metadata });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private toDateRange(query: AnalyticsQueryDto): DateRange {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    return { from, to };
  }
}
