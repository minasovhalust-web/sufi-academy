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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseModulesController = void 0;
const common_1 = require("@nestjs/common");
const course_modules_service_1 = require("../services/course-modules.service");
const create_course_module_dto_1 = require("../dto/module/create-course-module.dto");
const update_course_module_dto_1 = require("../dto/module/update-course-module.dto");
let CourseModulesController = class CourseModulesController {
    constructor(modulesService) {
        this.modulesService = modulesService;
    }
    create(courseId, dto, req) {
        return this.modulesService.create(courseId, dto, req.user.sub, req.user.role);
    }
    findAll(courseId) {
        return this.modulesService.findByCourse(courseId);
    }
    findOne(id) {
        return this.modulesService.findById(id);
    }
    update(id, dto, req) {
        return this.modulesService.update(id, dto, req.user.sub, req.user.role);
    }
    remove(id, req) {
        return this.modulesService.remove(id, req.user.sub, req.user.role);
    }
};
exports.CourseModulesController = CourseModulesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_course_module_dto_1.CreateCourseModuleDto, Object]),
    __metadata("design:returntype", void 0)
], CourseModulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CourseModulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CourseModulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_course_module_dto_1.UpdateCourseModuleDto, Object]),
    __metadata("design:returntype", void 0)
], CourseModulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CourseModulesController.prototype, "remove", null);
exports.CourseModulesController = CourseModulesController = __decorate([
    (0, common_1.Controller)('courses/:courseId/modules'),
    __metadata("design:paramtypes", [course_modules_service_1.CourseModulesService])
], CourseModulesController);
//# sourceMappingURL=course-modules.controller.js.map