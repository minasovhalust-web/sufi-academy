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
exports.LiveController = void 0;
const common_1 = require("@nestjs/common");
const live_service_1 = require("../services/live.service");
const create_session_dto_1 = require("../dto/create-session.dto");
let LiveController = class LiveController {
    constructor(liveService) {
        this.liveService = liveService;
    }
    create(dto, req) {
        return this.liveService.createSession(dto, req.user.sub, req.user.role);
    }
    start(id, req) {
        return this.liveService.startSession(id, req.user.sub, req.user.role);
    }
    end(id, req) {
        return this.liveService.endSession(id, req.user.sub, req.user.role);
    }
    findByCourse(courseId) {
        return this.liveService.findSessionsByCourse(courseId);
    }
    findOne(id) {
        return this.liveService.findSessionById(id);
    }
    getParticipants(id) {
        return this.liveService.getActiveParticipants(id);
    }
};
exports.LiveController = LiveController;
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_session_dto_1.CreateSessionDto, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('sessions/:id/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "start", null);
__decorate([
    (0, common_1.Patch)('sessions/:id/end'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "end", null);
__decorate([
    (0, common_1.Get)('sessions/course/:courseId'),
    __param(0, (0, common_1.Param)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "findByCourse", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('sessions/:id/participants'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "getParticipants", null);
exports.LiveController = LiveController = __decorate([
    (0, common_1.Controller)('live'),
    __metadata("design:paramtypes", [live_service_1.LiveService])
], LiveController);
//# sourceMappingURL=live.controller.js.map