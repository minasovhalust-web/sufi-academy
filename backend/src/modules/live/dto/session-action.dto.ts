import { IsString, IsUUID } from 'class-validator';

/**
 * SessionActionDto — minimal payload identifying a session.
 *
 * Reused across WebSocket events that only need the sessionId:
 *   join-session, leave-session, raise-hand, end-session
 */
export class SessionActionDto {
  @IsString()
  @IsUUID()
  sessionId: string;
}
