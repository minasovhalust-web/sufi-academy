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
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const lessons_repository_1 = require("../repositories/lessons.repository");
const course_modules_repository_1 = require("../repositories/course-modules.repository");
const courses_repository_1 = require("../repositories/courses.repository");
const enrollments_repository_1 = require("../repositories/enrollments.repository");
let LessonsService = class LessonsService {
    constructor(lessonsRepository, modulesRepository, coursesRepository, enrollmentsRepository) {
        this.lessonsRepository = lessonsRepository;
        this.modulesRepository = modulesRepository;
        this.coursesRepository = coursesRepository;
        this.enrollmentsRepository = enrollmentsRepository;
    }
    async assertEnrollmentActive(courseId, requesterId, requesterRole) {
        if (requesterRole === client_1.Role.ADMIN || requesterRole === client_1.Role.TEACHER)
            return;
        const enrollment = await this.enrollmentsRepository.findByUserAndCourse(requesterId, courseId);
        if (!enrollment || enrollment.status !== client_1.EnrollmentStatus.ACTIVE) {
            throw new common_1.ForbiddenException('You must have an approved (active) enrollment to access course materials');
        }
    }
    async assertModuleInstructor(moduleId, requesterId, requesterRole) {
        const module = await this.modulesRepository.findById(moduleId);
        if (!module)
            throw new common_1.NotFoundException(`Module #${moduleId} not found`);
        const course = await this.coursesRepository.findById(module.courseId);
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        if (course.instructorId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the course instructor can manage lessons');
        }
    }
    async create(moduleId, dto, requesterId, requesterRole) {
        await this.assertModuleInstructor(moduleId, requesterId, requesterRole);
        return this.lessonsRepository.create({
            ...dto,
            module: { connect: { id: moduleId } },
        });
    }
    async findByModule(moduleId, courseId, requesterId, requesterRole) {
        await this.assertEnrollmentActive(courseId, requesterId, requesterRole);
        return this.lessonsRepository.findByModule(moduleId);
    }
    async findById(id, courseId, requesterId, requesterRole) {
        const lesson = await this.lessonsRepository.findById(id);
        if (!lesson)
            throw new common_1.NotFoundException(`Lesson #${id} not found`);
        await this.assertEnrollmentActive(courseId, requesterId, requesterRole);
        return lesson;
    }
    async update(id, dto, requesterId, requesterRole) {
        const lesson = await this.lessonsRepository.findById(id);
        if (!lesson)
            throw new common_1.NotFoundException(`Lesson #${id} not found`);
        await this.assertModuleInstructor(lesson.moduleId, requesterId, requesterRole);
        return this.lessonsRepository.update(id, dto);
    }
    async remove(id, requesterId, requesterRole) {
        const lesson = await this.lessonsRepository.findById(id);
        if (!lesson)
            throw new common_1.NotFoundException(`Lesson #${id} not found`);
        await this.assertModuleInstructor(lesson.moduleId, requesterId, requesterRole);
        await this.lessonsRepository.delete(id);
    }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lessons_repository_1.LessonsRepository,
        course_modules_repository_1.CourseModulesRepository,
        courses_repository_1.CoursesRepository,
        enrollments_repository_1.EnrollmentsRepository])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map