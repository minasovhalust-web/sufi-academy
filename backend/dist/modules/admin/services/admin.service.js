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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
const admin_repository_1 = require("../repositories/admin.repository");
let AdminService = class AdminService {
    constructor(adminRepository, eventEmitter) {
        this.adminRepository = adminRepository;
        this.eventEmitter = eventEmitter;
    }
    async getDashboard() {
        return this.adminRepository.getDashboardStats();
    }
    async getUsers(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.adminRepository.findUsers({
                role: query.role,
                isActive: query.isActive,
                search: query.search,
                skip,
                take: limit,
            }),
            this.adminRepository.countUsers({
                role: query.role,
                isActive: query.isActive,
                search: query.search,
            }),
        ]);
        return { data, total, page, limit, hasMore: skip + data.length < total };
    }
    async getUserById(id) {
        const user = await this.adminRepository.findUserById(id);
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        return user;
    }
    async updateUserRole(id, dto, requesterId) {
        const user = await this.adminRepository.findUserById(id);
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        if (id === requesterId && dto.role !== client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Admins cannot change their own role to a lower privilege');
        }
        const updated = await this.adminRepository.updateUserRole(id, dto.role);
        if (dto.role === client_1.Role.TEACHER && user.role !== client_1.Role.TEACHER) {
            this.eventEmitter.emit('admin.teacher.assigned', {
                userId: id,
                assignedById: requesterId,
            });
        }
        return updated;
    }
    async updateUserStatus(id, dto, requesterId) {
        const user = await this.adminRepository.findUserById(id);
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        if (id === requesterId && !dto.isActive) {
            throw new common_1.BadRequestException('Admins cannot deactivate their own account');
        }
        return this.adminRepository.updateUserStatus(id, dto.isActive);
    }
    async getCourses(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.adminRepository.findCourses({
                status: query.status,
                teacherId: query.teacherId,
                search: query.search,
                skip,
                take: limit,
            }),
            this.adminRepository.countCourses({
                status: query.status,
                teacherId: query.teacherId,
                search: query.search,
            }),
        ]);
        return { data, total, page, limit, hasMore: skip + data.length < total };
    }
    async updateCourseStatus(id, dto) {
        const course = await this.adminRepository.findCourseById(id);
        if (!course)
            throw new common_1.NotFoundException(`Course #${id} not found`);
        return this.adminRepository.updateCourseStatus(id, dto.status);
    }
    async deleteCourse(id) {
        const course = await this.adminRepository.findCourseById(id);
        if (!course)
            throw new common_1.NotFoundException(`Course #${id} not found`);
        await this.adminRepository.deleteCourse(id);
    }
    async getEnrollments(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.adminRepository.findEnrollments({
                status: query.status,
                skip,
                take: limit,
            }),
            this.adminRepository.countEnrollments({ status: query.status }),
        ]);
        return { data, total, page, limit, hasMore: skip + data.length < total };
    }
    async approveEnrollment(id) {
        const enrollment = await this.adminRepository.findEnrollmentById(id);
        if (!enrollment)
            throw new common_1.NotFoundException(`Enrollment #${id} not found`);
        if (enrollment.status === client_1.EnrollmentStatus.ACTIVE) {
            throw new common_1.BadRequestException('Enrollment is already active');
        }
        const updated = await this.adminRepository.updateEnrollmentStatus(id, client_1.EnrollmentStatus.ACTIVE);
        this.eventEmitter.emit('enrollment.approved', {
            enrollmentId: id,
            userId: enrollment.user?.id,
            courseId: enrollment.course?.id,
            courseTitle: enrollment.course?.title,
        });
        return updated;
    }
    async rejectEnrollment(id) {
        const enrollment = await this.adminRepository.findEnrollmentById(id);
        if (!enrollment)
            throw new common_1.NotFoundException(`Enrollment #${id} not found`);
        if (enrollment.status === client_1.EnrollmentStatus.CANCELLED) {
            throw new common_1.BadRequestException('Enrollment is already cancelled');
        }
        const updated = await this.adminRepository.updateEnrollmentStatus(id, client_1.EnrollmentStatus.CANCELLED);
        this.eventEmitter.emit('enrollment.rejected', {
            enrollmentId: id,
            userId: enrollment.user?.id,
            courseId: enrollment.course?.id,
            courseTitle: enrollment.course?.title,
        });
        return updated;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_repository_1.AdminRepository,
        event_emitter_1.EventEmitter2])
], AdminService);
//# sourceMappingURL=admin.service.js.map