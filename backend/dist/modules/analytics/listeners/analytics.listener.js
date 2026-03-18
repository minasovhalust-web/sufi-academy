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
var AnalyticsListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const analytics_service_1 = require("../services/analytics.service");
let AnalyticsListener = AnalyticsListener_1 = class AnalyticsListener {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(AnalyticsListener_1.name);
    }
    async onCourseCreated(payload) {
        try {
            await this.analyticsService.log(client_1.ActivityEventType.COURSE_CREATED, payload.instructorId, payload.courseId, 'Course', { title: payload.title, slug: payload.slug });
        }
        catch (err) {
            this.logger.error(`onCourseCreated failed: ${err.message}`, err.stack);
        }
    }
    async onStudentEnrolled(payload) {
        try {
            await this.analyticsService.log(client_1.ActivityEventType.STUDENT_ENROLLED, payload.studentId, payload.courseId, 'Course', { courseTitle: payload.courseTitle, instructorId: payload.instructorId });
        }
        catch (err) {
            this.logger.error(`onStudentEnrolled failed: ${err.message}`, err.stack);
        }
    }
    async onVideoUploaded(payload) {
        try {
            await this.analyticsService.log(client_1.ActivityEventType.VIDEO_UPLOADED, payload.instructorId, payload.videoId, 'Video', { lessonId: payload.lessonId, title: payload.title });
        }
        catch (err) {
            this.logger.error(`onVideoUploaded failed: ${err.message}`, err.stack);
        }
    }
    async onChatMessageSent(payload) {
        try {
            await this.analyticsService.log(client_1.ActivityEventType.CHAT_MESSAGE_SENT, payload.senderId, payload.messageId, 'ChatMessage', { roomId: payload.roomId, courseId: payload.courseId });
        }
        catch (err) {
            this.logger.error(`onChatMessageSent failed: ${err.message}`, err.stack);
        }
    }
    async onLiveSessionStarted(payload) {
        try {
            await this.analyticsService.log(client_1.ActivityEventType.LIVE_SESSION_STARTED, payload.hostId, payload.sessionId, 'LiveSession', { courseId: payload.courseId, title: payload.title });
        }
        catch (err) {
            this.logger.error(`onLiveSessionStarted failed: ${err.message}`, err.stack);
        }
    }
    async onLiveSessionEnded(payload) {
        try {
            await this.analyticsService.log(client_1.ActivityEventType.LIVE_SESSION_ENDED, payload.hostId, payload.sessionId, 'LiveSession', {
                courseId: payload.courseId,
                title: payload.title,
                endedAt: payload.endedAt.toISOString(),
            });
        }
        catch (err) {
            this.logger.error(`onLiveSessionEnded failed: ${err.message}`, err.stack);
        }
    }
};
exports.AnalyticsListener = AnalyticsListener;
__decorate([
    (0, event_emitter_1.OnEvent)('course.created', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsListener.prototype, "onCourseCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('course.student.enrolled', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsListener.prototype, "onStudentEnrolled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('video.uploaded', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsListener.prototype, "onVideoUploaded", null);
__decorate([
    (0, event_emitter_1.OnEvent)('chat.message.sent', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsListener.prototype, "onChatMessageSent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('live.session.started', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsListener.prototype, "onLiveSessionStarted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('live.session.ended', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsListener.prototype, "onLiveSessionEnded", null);
exports.AnalyticsListener = AnalyticsListener = AnalyticsListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsListener);
//# sourceMappingURL=analytics.listener.js.map