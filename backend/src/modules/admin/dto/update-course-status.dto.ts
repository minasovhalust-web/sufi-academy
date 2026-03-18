import { IsEnum, IsNotEmpty } from 'class-validator';
import { CourseStatus } from '@prisma/client';

export class UpdateCourseStatusDto {
  @IsNotEmpty()
  @IsEnum(CourseStatus, {
    message: `status must be one of: ${Object.values(CourseStatus).join(', ')}`,
  })
  status: CourseStatus;
}
