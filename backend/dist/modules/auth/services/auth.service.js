"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../../users/services/users.service");
const auth_token_repository_1 = require("../repositories/auth-token.repository");
const role_enum_1 = require("../../../common/enums/role.enum");
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, authTokenRepository, jwtService) {
        this.usersService = usersService;
        this.authTokenRepository = authTokenRepository;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto, meta) {
        const user = await this.usersService.create({
            ...dto,
            role: role_enum_1.Role.STUDENT,
        });
        const tokens = await this.generateAndStoreTokens(user, meta);
        this.logger.log(`New student registered: ${user.id}`);
        return { user, tokens };
    }
    async login(email, password, meta) {
        const user = await this.usersService.validateCredentials(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        await this.authTokenRepository.deleteExpiredTokens(user.id);
        const tokens = await this.generateAndStoreTokens(user, meta);
        this.logger.log(`User logged in: ${user.id}`);
        return { user, tokens };
    }
    async refreshTokens(userId, rawRefreshToken, meta) {
        const storedToken = await this.authTokenRepository.findValidToken(rawRefreshToken);
        if (!storedToken || storedToken.userId !== userId) {
            this.logger.warn(`Potential refresh token reuse detected for user ${userId}. Revoking all tokens.`);
            await this.authTokenRepository.revokeAllUserTokens(userId);
            throw new common_1.UnauthorizedException('Refresh token is invalid or has been revoked.');
        }
        await this.authTokenRepository.revokeToken(rawRefreshToken);
        const user = await this.usersService.findById(userId);
        return this.generateAndStoreTokens(user, meta);
    }
    async logout(rawRefreshToken) {
        await this.authTokenRepository.revokeToken(rawRefreshToken);
    }
    async logoutAll(userId) {
        await this.authTokenRepository.revokeAllUserTokens(userId);
        this.logger.log(`All sessions revoked for user: ${userId}`);
    }
    async generateAndStoreTokens(user, meta) {
        const payload = {
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
    parseExpiresIn(expiresIn) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        auth_token_repository_1.AuthTokenRepository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map