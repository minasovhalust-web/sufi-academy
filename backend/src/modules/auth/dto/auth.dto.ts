import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() password: string;
}

export class RegisterDto {
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @MinLength(8) @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]+$/, { message: 'Password too weak.' })
  password: string;
  @IsString() @IsNotEmpty() @MaxLength(50) firstName: string;
  @IsString() @IsNotEmpty() @MaxLength(50) lastName: string;
}

export class RefreshTokenDto {
  @IsString() @IsNotEmpty() refreshToken: string;
}
