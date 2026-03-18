import {
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CourseStatus } from '@prisma/client';

export class GetCoursesDto {
  /** Filter by course status. Omit to get all statuses. */
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  /** Filter by instructor (teacher) UUID. */
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  /** Full-text search across course title and slug. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
