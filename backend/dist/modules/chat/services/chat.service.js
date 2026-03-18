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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const chat_repository_1 = require("../repositories/chat.repository");
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["TEACHER"] = "TEACHER";
    Role["STUDENT"] = "STUDENT";
})(Role || (Role = {}));
let ChatService = class ChatService {
    constructor(chatRepository, eventEmitter) {
        this.chatRepository = chatRepository;
        this.eventEmitter = eventEmitter;
    }
    async validateRoomAccess(courseId, userId, userRole) {
        if (userRole === Role.ADMIN)
            return;
        const allowed = await this.chatRepository.checkUserAccess(courseId, userId);
        if (!allowed) {
            throw new common_1.ForbiddenException('You must be actively enrolled in this course or be the instructor to access the chat');
        }
    }
    async getOrCreateRoom(courseId) {
        return this.chatRepository.findOrCreateRoom(courseId);
    }
    async getRoomMessages(courseId, userId, userRole, query) {
        await this.validateRoomAccess(courseId, userId, userRole);
        const room = await this.chatRepository.findRoomByCourse(courseId);
        if (!room) {
            return { messages: [], total: 0, hasMore: false };
        }
        const limit = query.limit ?? 50;
        const [messages, total] = await Promise.all([
            this.chatRepository.findMessages(room.id, { cursor: query.cursor, limit }),
            this.chatRepository.countMessages(room.id),
        ]);
        return {
            messages: messages.reverse(),
            total,
            hasMore: messages.length === limit,
        };
    }
    async sendMessage(courseId, content, senderId, senderRole, replyToId) {
        await this.validateRoomAccess(courseId, senderId, senderRole);
        const room = await this.chatRepository.findOrCreateRoom(courseId);
        const message = await this.chatRepository.createMessage({
            roomId: room.id,
            senderId,
            content,
            replyToId,
        });
        this.eventEmitter.emit('chat.message.sent', {
            messageId: message.id,
            roomId: room.id,
            courseId,
            senderId,
        });
        return message;
    }
    async getRecentMessages(courseId, cursor, limit = 50) {
        const room = await this.chatRepository.findRoomByCourse(courseId);
        if (!room)
            return [];
        const messages = await this.chatRepository.findMessages(room.id, {
            cursor,
            limit,
        });
        return messages.reverse();
    }
    async deleteMessage(messageId, requesterId, requesterRole) {
        const message = await this.chatRepository.findMessage(messageId);
        if (!message) {
            throw new common_1.NotFoundException(`Message #${messageId} not found`);
        }
        if (message.deletedAt) {
            throw new common_1.BadRequestException('Message has already been deleted');
        }
        if (message.senderId !== requesterId && requesterRole !== Role.ADMIN) {
            throw new common_1.ForbiddenException('You can only delete your own messages');
        }
        return this.chatRepository.softDeleteMessage(messageId);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_repository_1.ChatRepository,
        event_emitter_1.EventEmitter2])
], ChatService);
//# sourceMappingURL=chat.service.js.map