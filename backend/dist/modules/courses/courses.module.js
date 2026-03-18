"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const courses_controller_1 = require("./controllers/courses.controller");
const course_modules_controller_1 = require("./controllers/course-modules.controller");
const lessons_controller_1 = require("./controllers/lessons.controller");
const materials_controller_1 = require("./controllers/materials.controller");
const enrollments_controller_1 = require("./controllers/enrollments.controller");
const courses_service_1 = require("./services/courses.service");
const course_modules_service_1 = require("./services/course-modules.service");
const lessons_service_1 = require("./services/lessons.service");
const materials_service_1 = require("./services/materials.service");
const enrollments_service_1 = require("./services/enrollments.service");
const courses_repository_1 = require("./repositories/courses.repository");
const course_modules_repository_1 = require("./repositories/course-modules.repository");
const lessons_repository_1 = require("./repositories/lessons.repository");
const materials_repository_1 = require("./repositories/materials.repository");
const enrollments_repository_1 = require("./repositories/enrollments.repository");
let CoursesModule = class CoursesModule {
};
exports.CoursesModule = CoursesModule;
exports.CoursesModule = CoursesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [
            courses_controller_1.CoursesController,
            course_modules_controller_1.CourseModulesController,
            lessons_controller_1.LessonsController,
            materials_controller_1.MaterialsController,
            enrollments_controller_1.EnrollmentsController,
        ],
        providers: [
            courses_service_1.CoursesService,
            course_modules_service_1.CourseModulesService,
            lessons_service_1.LessonsService,
            materials_service_1.MaterialsService,
            enrollments_service_1.EnrollmentsService,
            courses_repository_1.CoursesRepository,
            course_modules_repository_1.CourseModulesRepository,
            lessons_repository_1.LessonsRepository,
            materials_repository_1.MaterialsRepository,
            enrollments_repository_1.EnrollmentsRepository,
        ],
        exports: [courses_service_1.CoursesService],
    })
], CoursesModule);
//# sourceMappingURL=courses.module.js.map