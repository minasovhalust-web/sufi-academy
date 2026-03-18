import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @MinLength(8) @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]+$/, { message: 'Password too weak.' })
  password: string;
  @IsString() @IsNotEmpty() @MaxLength(50) firstName: string;
  @IsString() @IsNotEmpty() @MaxLength(50) lastName: string;
  @IsEnum(Role) @IsOptional() role?: Role;
}
