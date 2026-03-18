import { IsString, IsInt, MinLength, Min } from 'class-validator';

export class CreateCourseModuleDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsInt()
  @Min(0)
  order: number;
}
