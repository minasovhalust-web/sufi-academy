import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

/**
 * AnalyticsController — ADMIN-only REST endpoints for platform analytics.
 *
 * All routes require Role.ADMIN (enforced via @Roles + global RolesGuard).
 *
 * GET /analytics/summary  → aggregated event counts + daily trend
 * GET /analytics/courses  → course-specific stats (enrollments, sessions)
 * GET /analytics/users    → top actors by activity volume
 */
@Controller('analytics')
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** GET /analytics/summary — global event summary + daily trend chart data. */
  @Get('summary')
  async getSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSummary(query);
  }

  /** GET /analytics/courses — course enrollment and session stats. */
  @Get('courses')
  async getCourseStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCourseStats(query);
  }

  /** GET /analytics/users — top active users ranked by event count. */
  @Get('users')
  async getUserStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUserStats(query);
  }
}
