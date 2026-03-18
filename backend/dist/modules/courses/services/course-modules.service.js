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
exports.CourseModulesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const course_modules_repository_1 = require("../repositories/course-modules.repository");
const courses_repository_1 = require("../repositories/courses.repository");
let CourseModulesService = class CourseModulesService {
    constructor(modulesRepository, coursesRepository) {
        this.modulesRepository = modulesRepository;
        this.coursesRepository = coursesRepository;
    }
    async assertInstructor(courseId, requesterId, requesterRole) {
        const course = await this.coursesRepository.findById(courseId);
        if (!course)
            throw new common_1.NotFoundException(`Course #${courseId} not found`);
        if (course.instructorId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the course instructor can manage modules');
        }
    }
    async create(courseId, dto, requesterId, requesterRole) {
        await this.assertInstructor(courseId, requesterId, requesterRole);
        return this.modulesRepository.create({
            ...dto,
            course: { connect: { id: courseId } },
        });
    }
    async findByCourse(courseId) {
        return this.modulesRepository.findByCourse(courseId);
    }
    async findById(id) {
        const module = await this.modulesRepository.findById(id);
        if (!module)
            throw new common_1.NotFoundException(`Module #${id} not found`);
        return module;
    }
    async update(id, dto, requesterId, requesterRole) {
        const module = await this.findById(id);
        await this.assertInstructor(module.courseId, requesterId, requesterRole);
        return this.modulesRepository.update(id, dto);
    }
    async remove(id, requesterId, requesterRole) {
        const module = await this.findById(id);
        await this.assertInstructor(module.courseId, requesterId, requesterRole);
        await this.modulesRepository.delete(id);
    }
};
exports.CourseModulesService = CourseModulesService;
exports.CourseModulesService = CourseModulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [course_modules_repository_1.CourseModulesRepository,
        courses_repository_1.CoursesRepository])
], CourseModulesService);
//# sourceMappingURL=course-modules.service.js.map