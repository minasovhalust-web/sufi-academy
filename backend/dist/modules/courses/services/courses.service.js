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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const courses_repository_1 = require("../repositories/courses.repository");
let CoursesService = class CoursesService {
    constructor(coursesRepository, eventEmitter) {
        this.coursesRepository = coursesRepository;
        this.eventEmitter = eventEmitter;
    }
    async create(dto, instructorId) {
        const existing = await this.coursesRepository.findBySlug(dto.slug);
        if (existing) {
            throw new common_1.ConflictException(`Course with slug "${dto.slug}" already exists`);
        }
        const course = await this.coursesRepository.create({
            ...dto,
            instructorId: instructorId,
        });
        this.eventEmitter.emit('course.created', {
            courseId: course.id,
            instructorId,
            title: course.title,
            slug: course.slug,
        });
        return course;
    }
    async findAll(filters) {
        return this.coursesRepository.findAll(filters);
    }
    async findMy(instructorId) {
        return this.coursesRepository.findAll({ instructorId });
    }
    async findById(id) {
        const course = await this.coursesRepository.findById(id);
        if (!course)
            throw new common_1.NotFoundException(`Course #${id} not found`);
        return course;
    }
    async update(id, dto, requesterId, requesterRole) {
        const course = await this.findById(id);
        if (course.instructorId !== requesterId &&
            requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the course instructor can edit this course');
        }
        if (dto.slug && dto.slug !== course.slug) {
            const existing = await this.coursesRepository.findBySlug(dto.slug);
            if (existing) {
                throw new common_1.ConflictException(`Slug "${dto.slug}" is already taken`);
            }
        }
        return this.coursesRepository.update(id, dto);
    }
    async remove(id, requesterId, requesterRole) {
        const course = await this.findById(id);
        if (course.instructorId !== requesterId &&
            requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the course instructor can delete this course');
        }
        await this.coursesRepository.delete(id);
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [courses_repository_1.CoursesRepository,
        event_emitter_1.EventEmitter2])
], CoursesService);
//# sourceMappingURL=courses.service.js.map