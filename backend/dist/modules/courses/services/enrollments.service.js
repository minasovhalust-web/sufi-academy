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
exports.EnrollmentsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const enrollments_repository_1 = require("../repositories/enrollments.repository");
const courses_repository_1 = require("../repositories/courses.repository");
let EnrollmentsService = class EnrollmentsService {
    constructor(enrollmentsRepository, coursesRepository, eventEmitter) {
        this.enrollmentsRepository = enrollmentsRepository;
        this.coursesRepository = coursesRepository;
        this.eventEmitter = eventEmitter;
    }
    async enroll(dto, userId) {
        const course = await this.coursesRepository.findById(dto.courseId);
        if (!course) {
            throw new common_1.NotFoundException(`Course #${dto.courseId} not found`);
        }
        const existing = await this.enrollmentsRepository.findByUserAndCourse(userId, dto.courseId);
        if (existing) {
            throw new common_1.ConflictException('You are already enrolled in this course');
        }
        const enrollment = await this.enrollmentsRepository.create({
            status: 'PENDING',
            user: { connect: { id: userId } },
            course: { connect: { id: dto.courseId } },
        });
        this.eventEmitter.emit('course.student.enrolled', {
            courseId: course.id,
            studentId: userId,
            instructorId: course.instructorId,
            courseTitle: course.title,
        });
        return enrollment;
    }
    async findMyEnrollments(userId) {
        return this.enrollmentsRepository.findByUser(userId);
    }
    async findByCourse(courseId, requesterId, requesterRole) {
        const course = await this.coursesRepository.findById(courseId);
        if (!course)
            throw new common_1.NotFoundException(`Course #${courseId} not found`);
        if (course.instructorId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the course instructor can view the enrollment list');
        }
        return this.enrollmentsRepository.findByCourse(courseId);
    }
    async updateProgress(courseId, userId, dto) {
        const enrollment = await this.enrollmentsRepository.findByUserAndCourse(userId, courseId);
        if (!enrollment) {
            throw new common_1.NotFoundException(`No enrollment found for course #${courseId}`);
        }
        return this.enrollmentsRepository.update(enrollment.id, dto);
    }
    async unenroll(courseId, userId) {
        const enrollment = await this.enrollmentsRepository.findByUserAndCourse(userId, courseId);
        if (!enrollment) {
            throw new common_1.NotFoundException(`No enrollment found for course #${courseId}`);
        }
        await this.enrollmentsRepository.delete(enrollment.id);
    }
};
exports.EnrollmentsService = EnrollmentsService;
exports.EnrollmentsService = EnrollmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [enrollments_repository_1.EnrollmentsRepository,
        courses_repository_1.CoursesRepository,
        event_emitter_1.EventEmitter2])
], EnrollmentsService);
//# sourceMappingURL=enrollments.service.js.map