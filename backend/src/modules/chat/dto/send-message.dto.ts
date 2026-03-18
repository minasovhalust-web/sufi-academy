import { IsOptional, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

/**
 * SendMessageDto — payload for the 'send-message' WebSocket event.
 *
 * The server validates access, persists the message, and broadcasts
 * the created ChatMessage to all clients in the room via 'new-message'.
 */
export class SendMessageDto {
  @IsString()
  @IsUUID()
  courseId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;

  /** Optional: ID of the message being replied to. */
  @IsOptional()
  @IsString()
  @IsUUID()
  replyToId?: string;
}
