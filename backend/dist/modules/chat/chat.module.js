"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const chat_controller_1 = require("./controllers/chat.controller");
const chat_service_1 = require("./services/chat.service");
const chat_repository_1 = require("./repositories/chat.repository");
const chat_gateway_1 = require("./gateway/chat.gateway");
const ws_jwt_guard_1 = require("./gateway/ws-jwt.guard");
const chat_listener_1 = require("./listeners/chat.listener");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.registerAsync({
                useFactory: (config) => ({
                    secret: config.getOrThrow('JWT_SECRET'),
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [
            chat_gateway_1.ChatGateway,
            chat_service_1.ChatService,
            chat_repository_1.ChatRepository,
            ws_jwt_guard_1.WsJwtGuard,
            chat_listener_1.ChatListener,
        ],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map