"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const live_controller_1 = require("./controllers/live.controller");
const live_service_1 = require("./services/live.service");
const live_repository_1 = require("./repositories/live.repository");
const live_gateway_1 = require("./gateway/live.gateway");
const ws_jwt_guard_1 = require("./gateway/ws-jwt.guard");
let LiveModule = class LiveModule {
};
exports.LiveModule = LiveModule;
exports.LiveModule = LiveModule = __decorate([
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
        controllers: [live_controller_1.LiveController],
        providers: [live_gateway_1.LiveGateway, live_service_1.LiveService, live_repository_1.LiveRepository, ws_jwt_guard_1.WsJwtGuard],
    })
], LiveModule);
//# sourceMappingURL=live.module.js.map