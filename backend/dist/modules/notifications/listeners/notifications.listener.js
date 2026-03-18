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
var NotificationsListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../services/notifications.service");
let NotificationsListener = NotificationsListener_1 = class NotificationsListener {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(NotificationsListener_1.name);
    }
    async onCourseCreated(payload) {
        try {
            await this.notificationsService.notifyUser(payload.instructorId, client_1.NotificationType.COURSE_CREATED, 'Course created', `Your course "${payload.title}" has been created successfully.`, { courseId: payload.courseId, slug: payload.slug });
        }
        catch (err) {
            this.logger.error(`onCourseCreated failed: ${err.message}`, err.stack);
        }
    }
    async onStudentEnrolled(payload) {
        try {
            await this.notificationsService.notifyUser(payload.instructorId, client_1.NotificationType.STUDENT_ENROLLED, 'New student enrolled', `A new student has enrolled in "${payload.courseTitle}".`, { courseId: payload.courseId, studentId: payload.studentId });
        }
        catch (err) {
            this.logger.error(`onStudentEnrolled failed: ${err.message}`, err.stack);
        }
    }
    async onLiveSessionStarted(payload) {
        try {
            await this.notificationsService.notifyUser(payload.hostId, client_1.NotificationType.LIVE_SESSION_STARTED, 'Live session started', `Your live session "${payload.title}" is now live!`, { sessionId: payload.sessionId, courseId: payload.courseId });
        }
        catch (err) {
            this.logger.error(`onLiveSessionStarted failed: ${err.message}`, err.stack);
        }
    }
    async onLiveSessionEnded(payload) {
        try {
            await this.notificationsService.notifyUser(payload.hostId, client_1.NotificationType.LIVE_SESSION_ENDED, 'Live session ended', `Your live session "${payload.title}" has ended.`, {
                sessionId: payload.sessionId,
                courseId: payload.courseId,
                endedAt: payload.endedAt.toISOString(),
            });
        }
        catch (err) {
            this.logger.error(`onLiveSessionEnded failed: ${err.message}`, err.stack);
        }
    }
    async onTeacherAssigned(payload) {
        try {
            await this.notificationsService.notifyUser(payload.userId, client_1.NotificationType.TEACHER_ASSIGNED, 'You are now a teacher', 'An administrator has granted you teacher privileges. You can now create courses and host live sessions.', { assignedById: payload.assignedById });
        }
        catch (err) {
            this.logger.error(`onTeacherAssigned failed: ${err.message}`, err.stack);
        }
    }
};
exports.NotificationsListener = NotificationsListener;
__decorate([
    (0, event_emitter_1.OnEvent)('course.created', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onCourseCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('course.student.enrolled', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onStudentEnrolled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('live.session.started', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onLiveSessionStarted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('live.session.ended', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onLiveSessionEnded", null);
__decorate([
    (0, event_emitter_1.OnEvent)('admin.teacher.assigned', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onTeacherAssigned", null);
exports.NotificationsListener = NotificationsListener = NotificationsListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsListener);
//# sourceMappingURL=notifications.listener.js.map