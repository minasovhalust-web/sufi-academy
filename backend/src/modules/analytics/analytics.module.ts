import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsListener } from './listeners/analytics.listener';

/**
 * AnalyticsModule — platform activity tracking and reporting.
 *
 * Architecture:
 *   AnalyticsListener (EventEmitter2) → AnalyticsService → AnalyticsRepository → Prisma
 *
 * The listener reacts to domain events emitted by other modules without
 * importing them. All needed data is carried in the event payload.
 * REST endpoints are ADMIN-only (enforced in the controller via @Roles).
 */
@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsRepository,
    AnalyticsListener,
  ],
})
export class AnalyticsModule {}
