import { IsString, IsUUID } from 'class-validator';

/**
 * MicActionDto — payload for grant-mic and revoke-mic events.
 *
 * Only the session host or an ADMIN can grant/revoke microphone access.
 * grant-mic also automatically lowers the target user's raised hand.
 */
export class MicActionDto {
  @IsString()
  @IsUUID()
  sessionId: string;

  /** The participant whose microphone status should be changed. */
  @IsString()
  @IsUUID()
  targetUserId: string;
}
