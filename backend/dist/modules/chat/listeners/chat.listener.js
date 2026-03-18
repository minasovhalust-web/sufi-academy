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
var ChatListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const chat_repository_1 = require("../repositories/chat.repository");
let ChatListener = ChatListener_1 = class ChatListener {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
        this.logger = new common_1.Logger(ChatListener_1.name);
    }
    async onCourseCreated(payload) {
        try {
            await this.chatRepository.findOrCreateRoom(payload.courseId);
            this.logger.log(`ChatRoom provisioned for course ${payload.courseId}`);
        }
        catch (err) {
            this.logger.error(`Failed to provision ChatRoom for course ${payload.courseId}: ${err.message}`, err.stack);
        }
    }
};
exports.ChatListener = ChatListener;
__decorate([
    (0, event_emitter_1.OnEvent)('course.created', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatListener.prototype, "onCourseCreated", null);
exports.ChatListener = ChatListener = ChatListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_repository_1.ChatRepository])
], ChatListener);
//# sourceMappingURL=chat.listener.js.map