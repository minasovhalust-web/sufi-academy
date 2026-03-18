import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { GetNotificationsDto } from '../dto/get-notifications.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/**
 * NotificationsController — REST endpoints for user notifications.
 *
 * All routes are authenticated (global JwtAuthGuard).
 * Users may only access their own notifications.
 *
 * GET  /notifications/my           → paginated list
 * PATCH /notifications/:id/read    → mark one notification as read
 * PATCH /notifications/read-all    → mark all notifications as read
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications/my — paginated list of the caller's notifications. */
  @Get('my')
  async getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationsService.findMyNotifications(userId, query);
  }

  /**
   * PATCH /notifications/read-all — mark all notifications as read.
   * Must be placed BEFORE :id to avoid "read-all" being parsed as a UUID.
   */
  @Patch('read-all')
  async markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  /** PATCH /notifications/:id/read — mark a single notification as read. */
  @Patch(':id/read')
  async markOneRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markOneRead(id, userId);
  }
}
