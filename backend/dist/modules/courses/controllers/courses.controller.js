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
exports.CoursesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const courses_service_1 = require("../services/courses.service");
const create_course_dto_1 = require("../dto/course/create-course.dto");
const update_course_dto_1 = require("../dto/course/update-course.dto");
const client_1 = require("@prisma/client");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const storage_interface_1 = require("../../storage/storage.interface");
const crypto_1 = require("crypto");
const path_1 = require("path");
let CoursesController = class CoursesController {
    constructor(coursesService, storageService) {
        this.coursesService = coursesService;
        this.storageService = storageService;
    }
    create(dto, req) {
        return this.coursesService.create(dto, req.user.sub);
    }
    findAll(status, instructorId) {
        return this.coursesService.findAll({ status, instructorId });
    }
    findMy(req) {
        return this.coursesService.findMy(req.user.sub);
    }
    findOne(id) {
        return this.coursesService.findById(id);
    }
    update(id, dto, req) {
        return this.coursesService.update(id, dto, req.user.sub, req.user.role);
    }
    async uploadImage(id, file, req) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        if (!file.mimetype.startsWith('image/')) {
            throw new common_1.BadRequestException('Only image files are allowed');
        }
        const ext = (0, path_1.extname)(file.originalname).toLowerCase();
        const key = `course-covers/${(0, crypto_1.randomUUID)()}${ext}`;
        await this.storageService.upload(file.buffer, key, file.mimetype);
        const imageUrl = await this.storageService.getSignedUrl(key, 60 * 60 * 24 * 365);
        await this.coursesService.updateImageUrl(id, imageUrl, req.user.sub, req.user.role);
        return { imageUrl };
    }
    remove(id, req) {
        return this.coursesService.remove(id, req.user.sub, req.user.role);
    }
};
exports.CoursesController = CoursesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_course_dto_1.CreateCourseDto, Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('instructorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "findMy", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_course_dto_1.UpdateCourseDto, Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 10 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "remove", null);
exports.CoursesController = CoursesController = __decorate([
    (0, common_1.Controller)('courses'),
    __param(1, (0, common_1.Inject)(storage_interface_1.STORAGE_SERVICE)),
    __metadata("design:paramtypes", [courses_service_1.CoursesService, Object])
], CoursesController);
//# sourceMappingURL=courses.controller.js.map