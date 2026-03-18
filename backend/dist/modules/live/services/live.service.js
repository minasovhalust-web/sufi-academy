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
exports.LiveService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const live_repository_1 = require("../repositories/live.repository");
let LiveService = class LiveService {
    constructor(liveRepository, eventEmitter) {
        this.liveRepository = liveRepository;
        this.eventEmitter = eventEmitter;
    }
    async createSession(dto, requesterId, requesterRole) {
        if (requesterRole !== client_1.Role.TEACHER && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only teachers and admins can create live sessions');
        }
        if (requesterRole === client_1.Role.TEACHER) {
            const isInstructor = await this.liveRepository.checkIsInstructor(dto.courseId, requesterId);
            if (!isInstructor) {
                throw new common_1.ForbiddenException('You can only create live sessions for courses you teach');
            }
        }
        return this.liveRepository.createSession({
            title: dto.title,
            courseId: dto.courseId,
            hostId: requesterId,
            scheduledAt: dto.scheduledAt,
        });
    }
    async findSessionById(id) {
        const session = await this.liveRepository.findSessionById(id);
        if (!session)
            throw new common_1.NotFoundException(`Session #${id} not found`);
        return session;
    }
    async findSessionsByCourse(courseId) {
        return this.liveRepository.findSessionsByCourse(courseId);
    }
    async startSession(sessionId, requesterId, requesterRole) {
        const session = await this.findSessionById(sessionId);
        if (session.hostId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the session host or an admin can start this session');
        }
        if (session.status !== client_1.SessionStatus.SCHEDULED) {
            throw new common_1.BadRequestException(`Cannot start a session with status "${session.status}"`);
        }
        const updatedSession = await this.liveRepository.updateSession(sessionId, {
            status: client_1.SessionStatus.LIVE,
            startedAt: new Date(),
        });
        this.eventEmitter.emit('live.session.started', {
            sessionId: updatedSession.id,
            courseId: updatedSession.courseId,
            hostId: updatedSession.hostId,
            title: updatedSession.title,
        });
        return updatedSession;
    }
    async endSession(sessionId, requesterId, requesterRole) {
        const session = await this.findSessionById(sessionId);
        if (session.hostId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the session host or an admin can end this session');
        }
        if (session.status === client_1.SessionStatus.ENDED) {
            throw new common_1.BadRequestException('Session has already ended');
        }
        const endedAt = new Date();
        const updatedSession = await this.liveRepository.updateSession(sessionId, {
            status: client_1.SessionStatus.ENDED,
            endedAt,
        });
        this.eventEmitter.emit('live.session.ended', {
            sessionId: updatedSession.id,
            courseId: updatedSession.courseId,
            hostId: updatedSession.hostId,
            title: updatedSession.title,
            endedAt,
        });
        return updatedSession;
    }
    async joinSession(sessionId, userId) {
        const session = await this.findSessionById(sessionId);
        if (session.status === client_1.SessionStatus.ENDED) {
            throw new common_1.BadRequestException('This session has already ended');
        }
        const isHost = session.hostId === userId;
        if (!isHost) {
            const hasAccess = await this.liveRepository.checkCourseAccess(session.courseId, userId);
            if (!hasAccess) {
                throw new common_1.ForbiddenException('You must be enrolled in this course to join the session');
            }
        }
        return this.liveRepository.findOrCreateParticipant(sessionId, userId, isHost ? client_1.ParticipantRole.HOST : client_1.ParticipantRole.STUDENT);
    }
    async leaveSession(sessionId, userId) {
        await this.liveRepository.markParticipantLeft(sessionId, userId);
    }
    async raiseHand(sessionId, userId) {
        const participant = await this.liveRepository.findParticipant(sessionId, userId);
        if (!participant || participant.leftAt !== null) {
            throw new common_1.ForbiddenException('You must be an active participant to raise your hand');
        }
        await this.liveRepository.updateParticipant(sessionId, userId, {
            handRaised: true,
        });
    }
    async grantMic(sessionId, targetUserId, requesterId, requesterRole) {
        const session = await this.findSessionById(sessionId);
        if (session.hostId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the session host can grant microphone access');
        }
        await this.liveRepository.updateParticipant(sessionId, targetUserId, {
            micEnabled: true,
            handRaised: false,
        });
    }
    async revokeMic(sessionId, targetUserId, requesterId, requesterRole) {
        const session = await this.findSessionById(sessionId);
        if (session.hostId !== requesterId && requesterRole !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only the session host can revoke microphone access');
        }
        await this.liveRepository.updateParticipant(sessionId, targetUserId, {
            micEnabled: false,
        });
    }
    async getSessionState(sessionId) {
        const session = await this.findSessionById(sessionId);
        const participants = await this.liveRepository.findActiveParticipants(sessionId);
        return { session, participants, activeCount: participants.length };
    }
    async getActiveParticipants(sessionId) {
        await this.findSessionById(sessionId);
        return this.liveRepository.findActiveParticipants(sessionId);
    }
};
exports.LiveService = LiveService;
exports.LiveService = LiveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [live_repository_1.LiveRepository,
        event_emitter_1.EventEmitter2])
], LiveService);
//# sourceMappingURL=live.service.js.map