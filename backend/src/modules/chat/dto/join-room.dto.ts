import { IsString, IsUUID, IsOptional } from 'class-validator';

/**
 * JoinRoomDto — sent by the client when subscribing to a course chat room.
 *
 * The server validates enrollment/instructor access, then calls client.join().
 * After joining, the server emits 'room-history' with the last 50 messages
 * (or starting from the cursor for loading older messages).
 */
export class JoinRoomDto {
  @IsString()
  @IsUUID()
  courseId: string;

  /**
   * Cursor for loading earlier messages.
   * Pass the ID of the oldest message currently visible to load the previous page.
   * Omit to load the most recent 50 messages.
   */
  @IsString()
  @IsUUID()
  @IsOptional()
  cursor?: string;
}
