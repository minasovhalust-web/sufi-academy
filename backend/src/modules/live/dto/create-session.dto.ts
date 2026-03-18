import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';

/**
 * CreateSessionDto — create a new live session for a course.
 *
 * Only the course instructor or an ADMIN can create sessions.
 * The creating user automatically becomes the session host.
 */
export class CreateSessionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsUUID()
  courseId: string;

  /**
   * Optional ISO 8601 timestamp for when the session is planned to start.
   * Informational only — the session goes LIVE only when the host calls PATCH /start.
   */
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
