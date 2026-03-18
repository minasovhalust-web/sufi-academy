import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  progress?: number;
}
