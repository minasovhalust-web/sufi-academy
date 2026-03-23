import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { DirectMessagesService } from '../services/direct-messages.service';
import { GetConversationDto } from '../dto/get-conversation.dto';
import { SendDirectMessageDto } from '../dto/send-direct-message.dto';

/**
 * DirectMessagesController — REST endpoints for 1-to-1 messaging.
 *
 * All routes are protected by the global JwtAuthGuard.
 * The authenticated user's id is read from req.user.sub (JWT payload).
 *
 * Endpoints:
 *   GET  /direct-messages               → list of conversations (latest message per partner)
 *   GET  /direct-messages/:userId       → message history with a specific user
 *   POST /direct-messages/:userId       → send a message to a specific user
 */
@Controller('direct-messages')
export class DirectMessagesController {
  constructor(private readonly service: DirectMessagesService) {}

  /**
   * Returns all conversations for the authenticated user.
   * Each entry contains the conversation partner's profile and the last message.
   */
  @Get()
  getConversations(@Req() req: any) {
    return this.service.getConversations(req.user.sub);
  }

  /**
   * Returns the message history between the authenticated user and :userId.
   * Messages are returned in chronological order (oldest first).
   *
   * Query params:
   *   limit — number of messages to return (1–100, default 50)
   */
  @Get(':userId')
  getMessages(
    @Param('userId') partnerId: string,
    @Req() req: any,
    @Query() query: GetConversationDto,
  ) {
    return this.service.getMessages(req.user.sub, partnerId, query);
  }

  /**
   * Sends a direct message to :userId.
   * Returns the created message with full sender/receiver profiles.
   */
  @Post(':userId')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('userId') receiverId: string,
    @Req() req: any,
    @Body() body: SendDirectMessageDto,
  ) {
    return this.service.sendMessage(req.user.sub, receiverId, body);
  }
}
