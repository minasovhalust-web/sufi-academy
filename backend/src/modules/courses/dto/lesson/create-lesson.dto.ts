import { IsString, IsInt, IsOptional, MinLength, Min } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  duration?: number; // minutes
}
