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
exports.VideosService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const videos_repository_1 = require("../repositories/videos.repository");
const storage_interface_1 = require("../../storage/storage.interface");
const STREAM_URL_TTL = 300;
const UPLOAD_URL_TTL = 3600;
let VideosService = class VideosService {
    constructor(videosRepository, storageService, eventEmitter) {
        this.videosRepository = videosRepository;
        this.storageService = storageService;
        this.eventEmitter = eventEmitter;
    }
    async requestUploadUrl(dto, requesterId, requesterRole) {
        await this.assertLessonInstructor(dto.lessonId, requesterId, requesterRole);
        const slug = dto.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const key = `videos/${dto.lessonId}/${Date.now()}-${slug}`;
        return this.storageService.getSignedUploadUrl(key, dto.mimeType, UPLOAD_URL_TTL);
    }
    async create(dto, requesterId, requesterRole) {
        await this.assertLessonInstructor(dto.lessonId, requesterId, requesterRole);
        const video = await this.videosRepository.create({
            title: dto.title,
            description: dto.description,
            storageKey: dto.storageKey,
            mimeType: dto.mimeType,
            duration: dto.duration,
            lesson: { connect: { id: dto.lessonId } },
        });
        this.eventEmitter.emit('video.uploaded', {
            videoId: video.id,
            lessonId: dto.lessonId,
            instructorId: requesterId,
            title: video.title,
        });
        return video;
    }
    async findByLesson(lessonId) {
        return this.videosRepository.findByLesson(lessonId);
    }
    async findById(id) {
        const video = await this.videosRepository.findById(id);
        if (!video)
            throw new common_1.NotFoundException(`Video #${id} not found`);
        return video;
    }
    async getStreamUrl(id) {
        const video = await this.findById(id);
        const streamUrl = await this.storageService.getSignedUrl(video.storageKey, STREAM_URL_TTL);
        return { streamUrl, expiresIn: STREAM_URL_TTL };
    }
    async update(id, dto, requesterId, requesterRole) {
        const video = await this.findById(id);
        await this.assertLessonInstructor(video.lessonId, requesterId, requesterRole);
        return this.videosRepository.update(id, dto);
    }
    async remove(id, requesterId, requesterRole) {
        const video = await this.findById(id);
        await this.assertLessonInstructor(video.lessonId, requesterId, requesterRole);
        await this.storageService.delete(video.storageKey);
        await this.videosRepository.delete(id);
    }
    async assertLessonInstructor(lessonId, requesterId, requesterRole) {
        const instructorId = await this.videosRepository.findLessonInstructorId(lessonId);
        if (instructorId === null) {
            throw new common_1.NotFoundException(`Lesson #${lessonId} not found`);
        }
        if (instructorId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the course instructor can manage videos for this lesson');
        }
    }
};
exports.VideosService = VideosService;
exports.VideosService = VideosService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(storage_interface_1.STORAGE_SERVICE)),
    __metadata("design:paramtypes", [videos_repository_1.VideosRepository, Object, event_emitter_1.EventEmitter2])
], VideosService);
//# sourceMappingURL=videos.service.js.map