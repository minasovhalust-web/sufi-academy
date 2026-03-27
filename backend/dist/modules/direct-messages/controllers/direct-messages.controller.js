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
exports.DirectMessagesController = void 0;
const common_1 = require("@nestjs/common");
const direct_messages_service_1 = require("../services/direct-messages.service");
const get_conversation_dto_1 = require("../dto/get-conversation.dto");
const send_direct_message_dto_1 = require("../dto/send-direct-message.dto");
let DirectMessagesController = class DirectMessagesController {
    constructor(service) {
        this.service = service;
    }
    getConversations(req) {
        return this.service.getConversations(req.user.sub);
    }
    getMessages(partnerId, req, query) {
        return this.service.getMessages(req.user.sub, partnerId, query);
    }
    sendMessage(receiverId, req, body) {
        return this.service.sendMessage(req.user.sub, receiverId, body);
    }
};
exports.DirectMessagesController = DirectMessagesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DirectMessagesController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, get_conversation_dto_1.GetConversationDto]),
    __metadata("design:returntype", void 0)
], DirectMessagesController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, send_direct_message_dto_1.SendDirectMessageDto]),
    __metadata("design:returntype", void 0)
], DirectMessagesController.prototype, "sendMessage", null);
exports.DirectMessagesController = DirectMessagesController = __decorate([
    (0, common_1.Controller)('direct-messages'),
    __metadata("design:paramtypes", [direct_messages_service_1.DirectMessagesService])
], DirectMessagesController);
//# sourceMappingURL=direct-messages.controller.js.map