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
var AuthTokenRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTokenRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../../prisma/prisma.service");
const refresh_token_entity_1 = require("../entities/refresh-token.entity");
let AuthTokenRepository = AuthTokenRepository_1 = class AuthTokenRepository {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuthTokenRepository_1.name);
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    mapToEntity(prismaToken) {
        return new refresh_token_entity_1.RefreshTokenEntity({
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
    async create(params) {
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
    async findValidToken(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        const token = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        if (!token)
            return null;
        const entity = this.mapToEntity(token);
        if (!entity.isValid)
            return null;
        return entity;
    }
    async revokeToken(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllUserTokens(userId) {
        const result = await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        this.logger.log(`Revoked ${result.count} token(s) for user ${userId}`);
    }
    async deleteExpiredTokens(userId) {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                expiresAt: { lt: new Date() },
            },
        });
    }
};
exports.AuthTokenRepository = AuthTokenRepository;
exports.AuthTokenRepository = AuthTokenRepository = AuthTokenRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthTokenRepository);
//# sourceMappingURL=auth-token.repository.js.map