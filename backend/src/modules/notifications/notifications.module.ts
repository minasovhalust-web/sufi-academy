import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsListener } from './listeners/notifications.listener';

/**
 * NotificationsModule — manages in-app notifications.
 *
 * Architecture:
 *   NotificationsListener (EventEmitter2) → NotificationsService → NotificationsRepository → Prisma
 *
 * The listener reacts to domain events emitted by other modules without
 * importing them. All needed data is carried in the event payload.
 */
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsListener,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
