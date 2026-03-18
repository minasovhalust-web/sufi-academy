import { IsString, IsUUID } from 'class-validator';

/**
 * DeleteMessageDto — payload for the 'delete-message' WebSocket event.
 *
 * courseId is required so the server can broadcast the 'message-deleted'
 * event to all clients in the correct room after soft-deleting the message.
 *
 * Authorization: only the message author or an ADMIN can delete.
 */
export class DeleteMessageDto {
  @IsString()
  @IsUUID()
  messageId: string;

  @IsString()
  @IsUUID()
  courseId: string;
}
