import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateScheduledLessonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  scheduledAt: string; // ISO 8601, e.g. "2026-04-15T10:00:00.000Z"

  @IsString()
  @IsOptional()
  lessonId?: string;
}
