import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { RegisterDto } from '../dto/auth.dto';
import { UserEntity } from '../../users/entities/user.entity';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly usersService;
    private readonly authTokenRepository;
    private readonly jwtService;
    private readonly logger;
    constructor(usersService: UsersService, authTokenRepository: AuthTokenRepository, jwtService: JwtService);
    register(dto: RegisterDto, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<{
        user: UserEntity;
        tokens: TokenPair;
    }>;
    login(email: string, password: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<{
        user: UserEntity;
        tokens: TokenPair;
    }>;
    refreshTokens(userId: string, rawRefreshToken: string, meta?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<TokenPair>;
    logout(rawRefreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    private generateAndStoreTokens;
    private parseExpiresIn;
}
