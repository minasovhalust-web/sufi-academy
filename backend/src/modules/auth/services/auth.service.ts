import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { RegisterDto } from '../dto/auth.dto';
import { UserEntity } from '../../users/entities/user.entity';
import { Role } from '../../../common/enums/role.enum';
import { JwtPayload } from '../strategies/jwt.strategy';

/**
 * Token pair returned on successful login or refresh.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService handles all authentication business logic.
 *
 * Responsibilities:
 * - User registration (delegates to UsersService)
 * - Login with credential validation
 * - JWT access token issuance (short-lived: 15m)
 * - Refresh token issuance, storage, and rotation
 * - Logout (token revocation)
 *
 * Token rotation strategy:
 * On every /auth/refresh call, the old refresh token is revoked and
 * a new one is issued. This limits the window in which a stolen
 * refresh token can be exploited.
 *
 * No direct Prisma access — all DB operations go through repositories.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new student account.
   * Role is always STUDENT — cannot be overridden via public registration.
   */
  async register(
    dto: RegisterDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ user: UserEntity; tokens: TokenPair }> {
    const user = await this.usersService.create({
      ...dto,
      role: Role.STUDENT, // Hardcoded — public registration is always STUDENT
    });

    const tokens = await this.generateAndStoreTokens(user, meta);

    this.logger.log(`New student registered: ${user.id}`);
    return { user, tokens };
  }

  /**
   * Authenticates a user by email and password.
   * Returns a token pair on success.
   */
  async login(
    email: string,
    password: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ user: UserEntity; tokens: TokenPair }> {
    const user = await this.usersService.validateCredentials(email, password);

    if (!user) {
      // Generic message — do not reveal whether the email exists
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Clean up stale tokens for this user on each login
    await this.authTokenRepository.deleteExpiredTokens(user.id);

    const tokens = await this.generateAndStoreTokens(user, meta);

    this.logger.log(`User logged in: ${user.id}`);
    return { user, tokens };
  }

  /**
   * Rotates tokens using a valid refresh token.
   *
   * Process:
   * 1. Validate the refresh token exists and is not revoked/expired.
   * 2. Revoke the old refresh token.
   * 3. Issue a new token pair.
   *
   * If the presented refresh token has already been revoked, it indicates
   * a potential replay attack — all tokens for the user are revoked.
   */
  async refreshTokens(
    userId: string,
    rawRefreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const storedToken =
      await this.authTokenRepository.findValidToken(rawRefreshToken);

    if (!storedToken || storedToken.userId !== userId) {
      // Token is invalid, revoked, or belongs to a different user.
      // Treat as potential token reuse attack — revoke everything.
      this.logger.warn(
        `Potential refresh token reuse detected for user ${userId}. Revoking all tokens.`,
      );
      await this.authTokenRepository.revokeAllUserTokens(userId);
      throw new UnauthorizedException(
        'Refresh token is invalid or has been revoked.',
      );
    }

    // Revoke the used token (rotation)
    await this.authTokenRepository.revokeToken(rawRefreshToken);

    // Load the user to embed fresh role in the new token
    const user = await this.usersService.findById(userId);

    return this.generateAndStoreTokens(user, meta);
  }

  /**
   * Logs out a user by revoking their current refresh token.
   */
  async logout(rawRefreshToken: string): Promise<void> {
    await this.authTokenRepository.revokeToken(rawRefreshToken);
  }

  /**
   * Logs out from ALL devices by revoking all refresh tokens.
   */
  async logoutAll(userId: string): Promise<void> {
    await this.authTokenRepository.revokeAllUserTokens(userId);
    this.logger.log(`All sessions revoked for user: ${userId}`);
  }

  // ── Private Helpers ──────────────────────────────────────

  /**
   * Issues a new access token + refresh token pair and persists the refresh token.
   */
  private async generateAndStoreTokens(
    user: UserEntity,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES ?? '7d',
    });

    // Calculate expiry date for the refresh token to store in DB
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES ?? '7d';
    const expiresAt = this.parseExpiresIn(refreshExpiresIn);

    await this.authTokenRepository.create({
      rawToken: refreshToken,
      userId: user.id,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Converts an expiry string like "7d" or "15m" to a future Date.
   */
  private parseExpiresIn(expiresIn: string): Date {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);
    const now = new Date();

    switch (unit) {
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
