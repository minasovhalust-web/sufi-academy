import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

/**
 * AuthTokenRepository manages refresh token persistence.
 *
 * Security design:
 * - Tokens are stored as SHA-256 hashes — never as raw values.
 * - hashToken() is used consistently for both storing and looking up tokens.
 * - Revoked tokens are soft-deleted (revokedAt set) so we can detect
 *   token reuse attacks: if a revoked token is presented, we know
 *   a replay attack may be occurring and can revoke ALL tokens for that user.
 */
@Injectable()
export class AuthTokenRepository {
  private readonly logger = new Logger(AuthTokenRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SHA-256 hash of the raw refresh token.
   * Deterministic — the same token always produces the same hash.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private mapToEntity(prismaToken: {
    id: string;
    tokenHash: string;
    userId: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }): RefreshTokenEntity {
    return new RefreshTokenEntity({
      id: prismaToken.id,
      tokenHash: prismaToken.tokenHash,
      userId: prismaToken.userId,
      userAgent: prismaToken.userAgent ?? undefined,
      ipAddress: prismaToken.ipAddress ?? undefined,
      expiresAt: prismaToken.expiresAt,
      revokedAt: prismaToken.revokedAt ?? undefined,
      createdAt: prismaToken.createdAt,
    });
  }

  /**
   * Stores a new refresh token.
   * Called after issuing a new token during login or token refresh.
   */
  async create(params: {
    rawToken: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<RefreshTokenEntity> {
    const token = await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(params.rawToken),
        userId: params.userId,
        expiresAt: params.expiresAt,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
      },
    });
    return this.mapToEntity(token);
  }

  /**
   * Finds a valid (non-revoked, non-expired) token by its raw value.
   * Returns null if the token doesn't exist, is revoked, or has expired.
   */
  async findValidToken(rawToken: string): Promise<RefreshTokenEntity | null> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!token) return null;

    const entity = this.mapToEntity(token);

    // Return null for expired or revoked tokens
    if (!entity.isValid) return null;

    return entity;
  }

  /**
   * Revokes a single token (e.g., on logout or token rotation).
   */
  async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes ALL active tokens for a user.
   * Used when:
   * - User changes password
   * - Admin deactivates user
   * - Token reuse attack detected
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Revoked ${result.count} token(s) for user ${userId}`);
  }

  /**
   * Deletes expired tokens for a given user.
   * Called periodically to prevent unbounded table growth.
   * In production, consider a scheduled cron job.
   */
  async deleteExpiredTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });
  }
}
