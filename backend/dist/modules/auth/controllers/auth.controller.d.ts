import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from '../dto/auth.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { JwtPayload } from '../strategies/jwt.strategy';
import { JwtRefreshPayload } from '../strategies/jwt-refresh.strategy';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        user: UserResponseDto;
    }>;
    login(dto: LoginDto, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        user: UserResponseDto;
    }>;
    refresh(_dto: RefreshTokenDto, currentUser: JwtRefreshPayload, req: Request): Promise<import("../services/auth.service").TokenPair>;
    logout(dto: RefreshTokenDto): Promise<void>;
    logoutAll(currentUser: JwtPayload): Promise<void>;
}
