import { PrismaService } from '../../../prisma/prisma.service';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
export declare class AuthTokenRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private hashToken;
    private mapToEntity;
    create(params: {
        rawToken: string;
        userId: string;
        expiresAt: Date;
        userAgent?: string;
        ipAddress?: string;
    }): Promise<RefreshTokenEntity>;
    findValidToken(rawToken: string): Promise<RefreshTokenEntity | null>;
    revokeToken(rawToken: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
    deleteExpiredTokens(userId: string): Promise<void>;
}
