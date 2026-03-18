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
var LiveGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const live_service_1 = require("../services/live.service");
const ws_jwt_guard_1 = require("./ws-jwt.guard");
const session_action_dto_1 = require("../dto/session-action.dto");
const mic_action_dto_1 = require("../dto/mic-action.dto");
const webrtc_signal_dto_1 = require("../dto/webrtc-signal.dto");
const sessionRoom = (sessionId) => `live:${sessionId}`;
let LiveGateway = LiveGateway_1 = class LiveGateway {
    constructor(liveService, jwtService) {
        this.liveService = liveService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(LiveGateway_1.name);
        this.userSockets = new Map();
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            const payload = await this.jwtService.verifyAsync(token);
            client.data.user = {
                id: payload.sub ?? payload.id,
                email: payload.email,
                role: payload.role,
                firstName: payload.firstName,
                lastName: payload.lastName,
            };
            this.userSockets.set(client.data.user.id, client.id);
            this.logger.log(`[/live] Connected: ${client.id} (user: ${client.data.user.id})`);
        }
        catch {
            this.logger.warn(`[/live] Unauthorized connection rejected: ${client.id}`);
            client.emit('exception', { message: 'Unauthorized: invalid or missing token' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data?.user?.id;
        if (!userId)
            return;
        this.userSockets.delete(userId);
        const roomsArray = Array.from(client.rooms || []);
        for (const room of roomsArray) {
            if (room.startsWith('live:')) {
                const sessionId = room.slice(5);
                this.liveService.leaveSession(sessionId, userId).catch(() => { });
                this.server.to(room).emit('participant-left', { userId, sessionId });
            }
        }
        this.logger.log(`[/live] Disconnected: ${client.id} (user: ${userId})`);
    }
    async handleJoinSession(client, dto) {
        try {
            const participant = await this.liveService.joinSession(dto.sessionId, client.data.user.id);
            await client.join(sessionRoom(dto.sessionId));
            const state = await this.liveService.getSessionState(dto.sessionId);
            client.emit('session-state', state);
            client.to(sessionRoom(dto.sessionId)).emit('participant-joined', {
                userId: client.data.user.id,
                firstName: client.data.user.firstName,
                lastName: client.data.user.lastName,
                role: participant.role,
                micEnabled: participant.micEnabled,
                handRaised: participant.handRaised,
            });
            this.logger.log(`[/live] User ${client.data.user.id} joined session ${dto.sessionId}`);
        }
        catch (error) {
            this.emitException(client, 'join-session', error.message);
        }
    }
    async handleLeaveSession(client, dto) {
        try {
            await this.liveService.leaveSession(dto.sessionId, client.data.user.id);
            await client.leave(sessionRoom(dto.sessionId));
            this.server.to(sessionRoom(dto.sessionId)).emit('participant-left', {
                userId: client.data.user.id,
                sessionId: dto.sessionId,
            });
        }
        catch (error) {
            this.emitException(client, 'leave-session', error.message);
        }
    }
    async handleRaiseHand(client, dto) {
        try {
            await this.liveService.raiseHand(dto.sessionId, client.data.user.id);
            this.server.to(sessionRoom(dto.sessionId)).emit('hand-raised', {
                userId: client.data.user.id,
                sessionId: dto.sessionId,
            });
        }
        catch (error) {
            this.emitException(client, 'raise-hand', error.message);
        }
    }
    async handleGrantMic(client, dto) {
        try {
            await this.liveService.grantMic(dto.sessionId, dto.targetUserId, client.data.user.id, client.data.user.role);
            this.server.to(sessionRoom(dto.sessionId)).emit('mic-granted', {
                userId: dto.targetUserId,
                sessionId: dto.sessionId,
            });
        }
        catch (error) {
            this.emitException(client, 'grant-mic', error.message);
        }
    }
    async handleRevokeMic(client, dto) {
        try {
            await this.liveService.revokeMic(dto.sessionId, dto.targetUserId, client.data.user.id, client.data.user.role);
            this.server.to(sessionRoom(dto.sessionId)).emit('mic-revoked', {
                userId: dto.targetUserId,
                sessionId: dto.sessionId,
            });
        }
        catch (error) {
            this.emitException(client, 'revoke-mic', error.message);
        }
    }
    handleWebRtcSignal(client, dto) {
        const targetSocketId = this.userSockets.get(dto.targetUserId);
        if (!targetSocketId) {
            this.emitException(client, 'webrtc-signal', `Peer ${dto.targetUserId} is not connected to /live`);
            return;
        }
        this.server.to(targetSocketId).emit('webrtc-signal', {
            fromUserId: client.data.user.id,
            sessionId: dto.sessionId,
            signal: dto.signal,
        });
    }
    async handleEndSession(client, dto) {
        try {
            const ended = await this.liveService.endSession(dto.sessionId, client.data.user.id, client.data.user.role);
            this.server.to(sessionRoom(dto.sessionId)).emit('session-ended', {
                sessionId: dto.sessionId,
                endedAt: ended.endedAt,
            });
            this.logger.log(`[/live] Session ${dto.sessionId} ended by user ${client.data.user.id}`);
        }
        catch (error) {
            this.emitException(client, 'end-session', error.message);
        }
    }
    extractToken(client) {
        const fromAuth = client.handshake.auth?.token;
        if (fromAuth)
            return fromAuth;
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader?.startsWith('Bearer '))
            return authHeader.slice(7);
        throw new Error('No authentication token provided');
    }
    emitException(client, event, message) {
        client.emit('exception', { event, message });
    }
};
exports.LiveGateway = LiveGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Object)
], LiveGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('join-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_action_dto_1.SessionActionDto]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leave-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_action_dto_1.SessionActionDto]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleLeaveSession", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('raise-hand'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_action_dto_1.SessionActionDto]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleRaiseHand", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('grant-mic'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mic_action_dto_1.MicActionDto]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleGrantMic", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('revoke-mic'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mic_action_dto_1.MicActionDto]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleRevokeMic", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('webrtc-signal'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, webrtc_signal_dto_1.WebRtcSignalDto]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleWebRtcSignal", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('end-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_action_dto_1.SessionActionDto]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleEndSession", null);
exports.LiveGateway = LiveGateway = LiveGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/live',
        cors: {
            origin: '*',
            credentials: true,
        },
    }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [live_service_1.LiveService,
        jwt_1.JwtService])
], LiveGateway);
//# sourceMappingURL=live.gateway.js.map