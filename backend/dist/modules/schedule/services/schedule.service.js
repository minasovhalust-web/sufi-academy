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
exports.ScheduleService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_repository_1 = require("../repositories/schedule.repository");
let ScheduleService = class ScheduleService {
    constructor(scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }
    async createLesson(courseId, dto, requesterId, requesterRole) {
        return this.scheduleRepository.create({
            title: dto.title,
            description: dto.description,
            scheduledAt: new Date(dto.scheduledAt),
            courseId,
            lessonId: dto.lessonId,
        });
    }
    async getCourseLessons(courseId) {
        return this.scheduleRepository.findByCourse(courseId);
    }
    async deleteLesson(id, requesterId, requesterRole) {
        const lesson = await this.scheduleRepository.findById(id);
        if (!lesson)
            throw new common_1.NotFoundException(`Scheduled lesson #${id} not found`);
        if (requesterRole !== client_1.Role.ADMIN && requesterRole !== client_1.Role.TEACHER) {
            throw new common_1.ForbiddenException('Only teachers and admins can delete scheduled lessons');
        }
        await this.scheduleRepository.delete(id);
    }
    async getMySchedule(userId, role) {
        if (role === client_1.Role.TEACHER || role === client_1.Role.ADMIN) {
            return this.scheduleRepository.findForInstructor(userId);
        }
        return this.scheduleRepository.findUpcomingForUser(userId);
    }
};
exports.ScheduleService = ScheduleService;
exports.ScheduleService = ScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_repository_1.ScheduleRepository])
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map