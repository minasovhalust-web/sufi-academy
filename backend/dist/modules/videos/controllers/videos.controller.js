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
exports.VideosController = void 0;
const common_1 = require("@nestjs/common");
const videos_service_1 = require("../services/videos.service");
const create_video_dto_1 = require("../dto/create-video.dto");
const update_video_dto_1 = require("../dto/update-video.dto");
const request_upload_url_dto_1 = require("../dto/request-upload-url.dto");
let VideosController = class VideosController {
    constructor(videosService) {
        this.videosService = videosService;
    }
    requestUploadUrl(dto, req) {
        return this.videosService.requestUploadUrl(dto, req.user.sub, req.user.role);
    }
    create(dto, req) {
        return this.videosService.create(dto, req.user.sub, req.user.role);
    }
    findByLesson(lessonId) {
        return this.videosService.findByLesson(lessonId);
    }
    findOne(id) {
        return this.videosService.findById(id);
    }
    getStreamUrl(id) {
        return this.videosService.getStreamUrl(id);
    }
    update(id, dto, req) {
        return this.videosService.update(id, dto, req.user.sub, req.user.role);
    }
    remove(id, req) {
        return this.videosService.remove(id, req.user.sub, req.user.role);
    }
};
exports.VideosController = VideosController;
__decorate([
    (0, common_1.Post)('upload-url'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_upload_url_dto_1.RequestUploadUrlDto, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "requestUploadUrl", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_video_dto_1.CreateVideoDto, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('lesson/:lessonId'),
    __param(0, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "findByLesson", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stream-url'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "getStreamUrl", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_video_dto_1.UpdateVideoDto, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "remove", null);
exports.VideosController = VideosController = __decorate([
    (0, common_1.Controller)('videos'),
    __metadata("design:paramtypes", [videos_service_1.VideosService])
], VideosController);
//# sourceMappingURL=videos.controller.js.map