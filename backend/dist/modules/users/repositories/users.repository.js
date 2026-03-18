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
var UsersRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const user_entity_1 = require("../entities/user.entity");
const role_enum_1 = require("../../../common/enums/role.enum");
let UsersRepository = UsersRepository_1 = class UsersRepository {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UsersRepository_1.name);
    }
    mapToEntity(prismaUser) {
        return new user_entity_1.UserEntity({
            id: prismaUser.id,
            email: prismaUser.email,
            password: prismaUser.password,
            firstName: prismaUser.firstName,
            lastName: prismaUser.lastName,
            role: prismaUser.role,
            isActive: prismaUser.isActive,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt,
        });
    }
    async create(dto) {
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email.toLowerCase().trim(),
                    password: dto.hashedPassword,
                    firstName: dto.firstName.trim(),
                    lastName: dto.lastName.trim(),
                    role: dto.role ?? role_enum_1.Role.STUDENT,
                },
            });
            return this.mapToEntity(user);
        }
        catch (error) {
            this.logger.error('Failed to create user', error);
            throw new common_1.InternalServerErrorException('Could not create user.');
        }
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.mapToEntity(user) : null;
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        return user ? this.mapToEntity(user) : null;
    }
    async findAll(params) {
        const { skip = 0, take = 20, role } = params;
        const users = await this.prisma.user.findMany({
            where: role ? { role } : undefined,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });
        return users.map((u) => this.mapToEntity(u));
    }
    async update(id, data) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
        });
        return this.mapToEntity(user);
    }
    async updatePassword(id, hashedPassword) {
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }
    async existsByEmail(email) {
        const count = await this.prisma.user.count({
            where: { email: email.toLowerCase().trim() },
        });
        return count > 0;
    }
    async countByRole(role) {
        return this.prisma.user.count({ where: { role } });
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = UsersRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map