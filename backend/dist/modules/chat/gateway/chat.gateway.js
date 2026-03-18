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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const chat_service_1 = require("../services/chat.service");
const ws_jwt_guard_1 = require("./ws-jwt.guard");
const join_room_dto_1 = require("../dto/join-room.dto");
const send_message_dto_1 = require("../dto/send-message.dto");
const delete_message_dto_1 = require("../dto/delete-message.dto");
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["TEACHER"] = "TEACHER";
    Role["STUDENT"] = "STUDENT";
})(Role || (Role = {}));
const roomKey = (courseId) => `course:${courseId}`;
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(chatService, jwtService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(ChatGateway_1.name);
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
            this.logger.log(`Client connected: ${client.id} (user: ${client.data.user.id})`);
        }
        catch {
            this.logger.warn(`Unauthorized WS connection rejected: ${client.id}`);
            client.emit('exception', { message: 'Unauthorized: invalid or missing token' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinRoom(client, dto) {
        try {
            await this.chatService.validateRoomAccess(dto.courseId, client.data.user.id, client.data.user.role);
            const room = roomKey(dto.courseId);
            await client.join(room);
            const messages = await this.chatService.getRecentMessages(dto.courseId, dto.cursor);
            client.emit('room-history', {
                messages,
                hasMore: messages.length >= 50,
            });
            client.emit('room-joined', {
                courseId: dto.courseId,
                socketId: client.id,
            });
            this.logger.log(`User ${client.data.user.id} joined room ${room}`);
        }
        catch (error) {
            this.emitException(client, 'join-room', error.message);
        }
    }
    async handleLeaveRoom(client, dto) {
        const room = roomKey(dto.courseId);
        await client.leave(room);
        this.logger.log(`User ${client.data.user.id} left room ${room}`);
    }
    async handleSendMessage(client, dto) {
        try {
            const message = await this.chatService.sendMessage(dto.courseId, dto.content, client.data.user.id, client.data.user.role, dto.replyToId);
            this.server.to(roomKey(dto.courseId)).emit('new-message', message);
        }
        catch (error) {
            this.emitException(client, 'send-message', error.message);
        }
    }
    async handleDeleteMessage(client, dto) {
        try {
            const deleted = await this.chatService.deleteMessage(dto.messageId, client.data.user.id, client.data.user.role);
            this.server.to(roomKey(dto.courseId)).emit('message-deleted', {
                messageId: dto.messageId,
                courseId: dto.courseId,
                deletedAt: deleted.deletedAt,
            });
        }
        catch (error) {
            this.emitException(client, 'delete-message', error.message);
        }
    }
    handleTyping(client, dto) {
        client.to(roomKey(dto.courseId)).emit('user-typing', {
            userId: client.data.user.id,
            firstName: client.data.user.firstName,
            lastName: client.data.user.lastName,
        });
    }
    extractToken(client) {
        const fromAuth = client.handshake.auth?.token;
        if (fromAuth)
            return fromAuth;
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader?.startsWith('Bearer '))
            return authHeader.slice(7);
        throw (0, websockets_1.WsException)('No authentication token provided');
    }
    emitException(client, event, message) {
        client.emit('exception', { event, message });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Object)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, join_room_dto_1.JoinRoomDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leave-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, join_room_dto_1.JoinRoomDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('send-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('delete-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delete_message_dto_1.DeleteMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, join_room_dto_1.JoinRoomDto]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/chat',
        cors: {
            origin: '*',
            credentials: true,
        },
    }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map