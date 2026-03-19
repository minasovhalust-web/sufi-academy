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
var LocalProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path_1 = require("path");
let LocalProvider = LocalProvider_1 = class LocalProvider {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(LocalProvider_1.name);
        this.uploadDir = (0, path_1.join)(process.cwd(), 'uploads');
        if (!(0, fs_1.existsSync)(this.uploadDir)) {
            (0, fs_1.mkdirSync)(this.uploadDir, { recursive: true });
        }
        const port = this.config.get('APP_PORT', '4000');
        this.baseUrl = `http://95.179.187.108:${port}`;
        this.logger.warn('LocalProvider active — files saved to ./uploads/. Set STORAGE_BUCKET to use S3.');
    }
    async upload(buffer, key, _mimeType) {
        const filename = key.replace(/\//g, '_');
        const filePath = (0, path_1.join)(this.uploadDir, filename);
        (0, fs_1.writeFileSync)(filePath, buffer);
        this.logger.log(`LocalProvider: saved ${filename}`);
        const url = `${this.baseUrl}/uploads/${filename}`;
        return { key, url };
    }
    async getSignedUrl(key, _ttlSeconds) {
        if (key.startsWith('http'))
            return key;
        const filename = key.replace(/\//g, '_');
        return `${this.baseUrl}/uploads/${filename}`;
    }
    async getSignedUploadUrl(key, _mimeType, _ttlSeconds) {
        const filename = key.replace(/\//g, '_');
        return {
            uploadUrl: `${this.baseUrl}/api/v1/storage/upload`,
            key: filename,
            expiresIn: 3600,
        };
    }
    async delete(key) {
        const filename = key.replace(/\//g, '_');
        const filePath = (0, path_1.join)(this.uploadDir, filename);
        if ((0, fs_1.existsSync)(filePath)) {
            (0, fs_1.unlinkSync)(filePath);
            this.logger.log(`LocalProvider: deleted ${filename}`);
        }
    }
};
exports.LocalProvider = LocalProvider;
exports.LocalProvider = LocalProvider = LocalProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalProvider);
//# sourceMappingURL=local.provider.js.map