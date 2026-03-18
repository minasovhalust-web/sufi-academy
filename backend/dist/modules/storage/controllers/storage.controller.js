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
var StorageController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const storage_interface_1 = require("../storage.interface");
const crypto_1 = require("crypto");
const path_1 = require("path");
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_MIME_EXACT = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
function isAllowedMime(mime) {
    if (ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p)))
        return true;
    if (ALLOWED_MIME_EXACT.includes(mime))
        return true;
    return false;
}
let StorageController = StorageController_1 = class StorageController {
    constructor(storageService) {
        this.storageService = storageService;
        this.logger = new common_1.Logger(StorageController_1.name);
    }
    async uploadFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file received. Send a multipart/form-data POST with a field named "file".');
        }
        if (!isAllowedMime(file.mimetype)) {
            throw new common_1.BadRequestException(`File type "${file.mimetype}" is not allowed. ` +
                'Permitted types: images, video, audio, PDF, Word documents.');
        }
        const ext = (0, path_1.extname)(file.originalname).toLowerCase();
        const key = `chat-uploads/${(0, crypto_1.randomUUID)()}${ext}`;
        await this.storageService.upload(file.buffer, key, file.mimetype);
        const url = await this.storageService.getSignedUrl(key, 60 * 60 * 24 * 30);
        this.logger.log(`Chat upload OK — key=${key}  mime=${file.mimetype}  size=${file.size}B`);
        return {
            key,
            url,
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        };
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: MAX_BYTES },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "uploadFile", null);
exports.StorageController = StorageController = StorageController_1 = __decorate([
    (0, common_1.Controller)('storage'),
    __param(0, (0, common_1.Inject)(storage_interface_1.STORAGE_SERVICE)),
    __metadata("design:paramtypes", [Object])
], StorageController);
//# sourceMappingURL=storage.controller.js.map