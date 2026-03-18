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
var S3Provider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Provider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let S3Provider = S3Provider_1 = class S3Provider {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(S3Provider_1.name);
        this.bucket = this.config.getOrThrow('STORAGE_BUCKET');
        const endpoint = this.config.get('STORAGE_ENDPOINT');
        const forcePathStyle = this.config.get('STORAGE_FORCE_PATH_STYLE') === 'true';
        this.client = new client_s3_1.S3Client({
            region: this.config.get('STORAGE_REGION', 'us-east-1'),
            ...(endpoint ? { endpoint } : {}),
            credentials: {
                accessKeyId: this.config.getOrThrow('STORAGE_ACCESS_KEY'),
                secretAccessKey: this.config.getOrThrow('STORAGE_SECRET_KEY'),
            },
            forcePathStyle,
        });
    }
    async upload(buffer, key, mimeType) {
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));
        this.logger.log(`Uploaded: ${key}`);
        const url = await this.getSignedUrl(key);
        return { key, url };
    }
    async getSignedUrl(key, ttlSeconds = 300) {
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: ttlSeconds });
    }
    async getSignedUploadUrl(key, mimeType, ttlSeconds = 3600) {
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: mimeType,
        }), { expiresIn: ttlSeconds });
        return { uploadUrl, key, expiresIn: ttlSeconds };
    }
    async delete(key) {
        await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        this.logger.log(`Deleted: ${key}`);
    }
};
exports.S3Provider = S3Provider;
exports.S3Provider = S3Provider = S3Provider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Provider);
//# sourceMappingURL=s3.provider.js.map