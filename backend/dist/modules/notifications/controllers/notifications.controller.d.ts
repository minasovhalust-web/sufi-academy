import { NotificationsService } from '../services/notifications.service';
import { GetNotificationsDto } from '../dto/get-notifications.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(userId: string, query: GetNotificationsDto): Promise<import("../services/notifications.service").PaginatedNotifications>;
    markAllRead(userId: string): Promise<{
        updated: number;
    }>;
    markOneRead(id: string, userId: string): Promise<any>;
}
