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
exports.DirectMessagesService = void 0;
const common_1 = require("@nestjs/common");
const direct_messages_repository_1 = require("../repositories/direct-messages.repository");
let DirectMessagesService = class DirectMessagesService {
    constructor(repo) {
        this.repo = repo;
    }
    async getConversations(userId) {
        return this.repo.findConversations(userId);
    }
    async getMessages(requesterId, partnerId, query) {
        if (requesterId === partnerId) {
            throw new common_1.ForbiddenException('You cannot view a conversation with yourself');
        }
        const exists = await this.repo.receiverExists(partnerId);
        if (!exists)
            throw new common_1.NotFoundException(`User #${partnerId} not found`);
        return this.repo.findMessages(requesterId, partnerId, query.limit ?? 50);
    }
    async sendMessage(senderId, receiverId, dto) {
        if (senderId === receiverId) {
            throw new common_1.ForbiddenException('You cannot send a message to yourself');
        }
        const exists = await this.repo.receiverExists(receiverId);
        if (!exists)
            throw new common_1.NotFoundException(`User #${receiverId} not found`);
        return this.repo.createMessage(senderId, receiverId, dto.content);
    }
};
exports.DirectMessagesService = DirectMessagesService;
exports.DirectMessagesService = DirectMessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [direct_messages_repository_1.DirectMessagesRepository])
], DirectMessagesService);
//# sourceMappingURL=direct-messages.service.js.map