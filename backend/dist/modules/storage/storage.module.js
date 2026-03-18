"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const s3_provider_1 = require("./providers/s3.provider");
const local_provider_1 = require("./providers/local.provider");
const storage_interface_1 = require("./storage.interface");
const storage_controller_1 = require("./controllers/storage.controller");
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            platform_express_1.MulterModule.register({ storage: (0, multer_1.memoryStorage)() }),
        ],
        controllers: [storage_controller_1.StorageController],
        providers: [
            {
                provide: storage_interface_1.STORAGE_SERVICE,
                useFactory: (config) => {
                    const hasBucket = !!config.get('STORAGE_BUCKET');
                    return hasBucket ? new s3_provider_1.S3Provider(config) : new local_provider_1.LocalProvider(config);
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [storage_interface_1.STORAGE_SERVICE],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map