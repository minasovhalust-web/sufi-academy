"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectMessagesModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const direct_messages_controller_1 = require("./controllers/direct-messages.controller");
const direct_messages_service_1 = require("./services/direct-messages.service");
const direct_messages_repository_1 = require("./repositories/direct-messages.repository");
let DirectMessagesModule = class DirectMessagesModule {
};
exports.DirectMessagesModule = DirectMessagesModule;
exports.DirectMessagesModule = DirectMessagesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [direct_messages_controller_1.DirectMessagesController],
        providers: [direct_messages_service_1.DirectMessagesService, direct_messages_repository_1.DirectMessagesRepository],
    })
], DirectMessagesModule);
//# sourceMappingURL=direct-messages.module.js.map