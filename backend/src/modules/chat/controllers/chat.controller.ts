import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { GetMessagesDto } from '../dto/get-messages.dto';
import { SendMessageRestDto } from '../dto/send-message-rest.dto';

/**
 * ChatController — REST endpoints for course chat.
 *
 * Protected by the global JwtAuthGuard (all routes require authentication).
 * Authorization (enrollment / instructor / ADMIN check) is enforced inside ChatService.
 *
 * Endpoints:
 *   GET  /chat/rooms/:courseId/messages — paginated message history
 *   POST /chat/rooms/:courseId/messages — send a message (for non-WS clients)
 *
 * Real-time delivery (new-message, message-deleted, typing) goes through
 * the WebSocket gateway at namespace /chat.
 */
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Returns paginated message history for a course's chat room.
   *
   * Access: ACTIVE enrollment, course instructor, or ADMIN.
   *
   * Supports cursor-based pagination:
   *   - Omit cursor to get the most recent messages
   *   - Pass cursor (oldest visible message ID) to load earlier messages
   */
  @Get('rooms/:courseId/messages')
  getMessages(
    @Param('courseId') courseId: string,
    @Query() query: GetMessagesDto,
    @Req() req: any,
  ) {
    return this.chatService.getRoomMessages(
      courseId,
      req.user.sub,
      req.user.role,
      query,
    );
  }

  /**
   * Send a message via REST (alternative to the WebSocket send-message event).
   *
   * Access: same rules as GET — ACTIVE enrollment, instructor, or ADMIN.
   * The message is persisted and the chat.message.sent event is emitted so
   * the WebSocket gateway can broadcast it to connected clients.
   *
   * Note: Connected WebSocket clients will receive the message in real time
   * via the 'new-message' event; REST-only clients should poll GET if needed.
   */
  @Post('rooms/:courseId/messages')
  sendMessage(
    @Param('courseId') courseId: string,
    @Body() body: SendMessageRestDto,
    @Req() req: any,
  ) {
    return this.chatService.sendMessage(
      courseId,
      body.content,
      req.user.sub,
      req.user.role,
    );
  }
}
