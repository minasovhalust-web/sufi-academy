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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const event_emitter_1 = require("@nestjs/event-emitter");
const users_repository_1 = require("../repositories/users.repository");
const role_enum_1 = require("../../../common/enums/role.enum");
const BCRYPT_SALT_ROUNDS = 12;
let UsersService = UsersService_1 = class UsersService {
    constructor(usersRepository, eventEmitter) {
        this.usersRepository = usersRepository;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async create(dto) {
        const emailExists = await this.usersRepository.existsByEmail(dto.email);
        if (emailExists) {
            throw new common_1.ConflictException(`A user with email "${dto.email}" already exists.`);
        }
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
        const user = await this.usersRepository.create({
            ...dto,
            role: dto.role ?? role_enum_1.Role.STUDENT,
            hashedPassword,
        });
        this.logger.log(`User created: ${user.id} [${user.role}]`);
        return user;
    }
    async findById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found.`);
        }
        return user;
    }
    async findByEmail(email) {
        return this.usersRepository.findByEmail(email);
    }
    async findAll(params) {
        const { page = 1, limit = 20, role } = params;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.usersRepository.findAll({ skip, take: limit, role }),
            role
                ? this.usersRepository.countByRole(role)
                :
                    this.usersRepository.findAll({ skip: 0, take: 10000 }).then((u) => u.length),
        ]);
        return { users, total };
    }
    async update(id, dto, updatedById) {
        const existing = await this.findById(id);
        const updated = await this.usersRepository.update(id, {
            ...(dto.firstName && { firstName: dto.firstName }),
            ...(dto.lastName && { lastName: dto.lastName }),
            ...(dto.email && { email: dto.email }),
            ...(dto.role && { role: dto.role }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        });
        if (dto.role === role_enum_1.Role.TEACHER &&
            existing.role !== role_enum_1.Role.TEACHER &&
            updatedById) {
            this.eventEmitter.emit('admin.teacher.assigned', {
                userId: id,
                assignedById: updatedById,
            });
        }
        return updated;
    }
    async updatePassword(id, currentPassword, newPassword) {
        const user = await this.findById(id);
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.ConflictException('Current password is incorrect.');
        }
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await this.usersRepository.updatePassword(id, hashedPassword);
        this.logger.log(`Password updated for user: ${id}`);
    }
    async validateCredentials(email, password) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user || !user.isActive) {
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        event_emitter_1.EventEmitter2])
], UsersService);
//# sourceMappingURL=users.service.js.map