import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() @MaxLength(50) firstName?: string;
  @IsString() @IsOptional() @MaxLength(50) lastName?: string;
  @IsEnum(Role) @IsOptional() role?: Role;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
