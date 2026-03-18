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
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const materials_repository_1 = require("../repositories/materials.repository");
const lessons_repository_1 = require("../repositories/lessons.repository");
const courses_repository_1 = require("../repositories/courses.repository");
const enrollments_repository_1 = require("../repositories/enrollments.repository");
let MaterialsService = class MaterialsService {
    constructor(materialsRepository, lessonsRepository, coursesRepository, enrollmentsRepository) {
        this.materialsRepository = materialsRepository;
        this.lessonsRepository = lessonsRepository;
        this.coursesRepository = coursesRepository;
        this.enrollmentsRepository = enrollmentsRepository;
    }
    async assertEnrollmentActiveForLesson(lessonId, requesterId, requesterRole) {
        if (requesterRole === client_1.Role.ADMIN || requesterRole === client_1.Role.TEACHER)
            return;
        const lesson = await this.lessonsRepository.findById(lessonId);
        if (!lesson)
            throw new common_1.NotFoundException(`Lesson #${lessonId} not found`);
        const courseId = lesson.module?.courseId ?? lesson.module?.course?.id;
        const enrollment = await this.enrollmentsRepository.findByUserAndCourse(requesterId, courseId);
        if (!enrollment || enrollment.status !== client_1.EnrollmentStatus.ACTIVE) {
            throw new common_1.ForbiddenException('You must have an approved (active) enrollment to access course materials');
        }
    }
    async assertLessonInstructor(lessonId, requesterId, requesterRole) {
        const lesson = await this.lessonsRepository.findById(lessonId);
        if (!lesson)
            throw new common_1.NotFoundException(`Lesson #${lessonId} not found`);
        const courseId = lesson.module?.courseId;
        const course = await this.coursesRepository.findById(courseId);
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        if (course.instructorId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the course instructor can manage materials');
        }
    }
    async create(lessonId, dto, requesterId, requesterRole) {
        await this.assertLessonInstructor(lessonId, requesterId, requesterRole);
        return this.materialsRepository.create({
            ...dto,
            lesson: { connect: { id: lessonId } },
        });
    }
    async findByLesson(lessonId, requesterId, requesterRole) {
        await this.assertEnrollmentActiveForLesson(lessonId, requesterId, requesterRole);
        return this.materialsRepository.findByLesson(lessonId);
    }
    async findById(id, requesterId, requesterRole) {
        const material = await this.materialsRepository.findById(id);
        if (!material)
            throw new common_1.NotFoundException(`Material #${id} not found`);
        await this.assertEnrollmentActiveForLesson(material.lessonId, requesterId, requesterRole);
        return material;
    }
    async remove(id, requesterId, requesterRole) {
        const material = await this.findById(id, requesterId, requesterRole);
        await this.assertLessonInstructor(material.lessonId, requesterId, requesterRole);
        await this.materialsRepository.delete(id);
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [materials_repository_1.MaterialsRepository,
        lessons_repository_1.LessonsRepository,
        courses_repository_1.CoursesRepository,
        enrollments_repository_1.EnrollmentsRepository])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map