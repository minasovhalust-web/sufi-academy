import { IsString, IsEnum, MinLength } from 'class-validator';
import { MaterialType } from '@prisma/client';

export class CreateMaterialDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsEnum(MaterialType)
  type: MaterialType;

  @IsString()
  url: string;
}
