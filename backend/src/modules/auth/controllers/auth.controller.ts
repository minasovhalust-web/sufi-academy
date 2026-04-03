import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { AuthService } from '../services/auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from '../dto/auth.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../strategies/jwt.strategy';
import { JwtRefreshPayload } from '../strategies/jwt-refresh.strategy';

class VerifyEmailDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() @Length(6, 6) code: string;
}

class ResendVerificationDto {
  @IsEmail() email: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  /**
   * POST /auth/verify-email
   * Verifies the 6-digit code sent to the user's email.
   * Returns a token pair on success so the user is immediately logged in.
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    const { user, tokens } = await this.authService.verifyEmail(dto.email, dto.code, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    return { user: new UserResponseDto(user), ...tokens };
  }

  /**
   * POST /auth/resend-verification
   * Sends a new 6-digit verification code to the user's email.
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationCode(dto.email);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const { user, tokens } = await this.authService.login(dto.email, dto.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    return { user: new UserResponseDto(user), ...tokens };
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() _dto: RefreshTokenDto, @CurrentUser() currentUser: JwtRefreshPayload, @Req() req: Request) {
    return this.authService.refreshTokens(currentUser.sub, currentUser.refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() currentUser: JwtPayload): Promise<void> {
    await this.authService.logoutAll(currentUser.sub);
  }
}
