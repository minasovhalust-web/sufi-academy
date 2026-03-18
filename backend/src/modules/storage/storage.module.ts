import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { S3Provider } from './providers/s3.provider';
import { LocalProvider } from './providers/local.provider';
import { STORAGE_SERVICE } from './storage.interface';
import { StorageController } from './controllers/storage.controller';

/**
 * StorageModule — provides S3-backed (or local-disk) file storage.
 *
 * Provider selection:
 *   - If STORAGE_BUCKET is set in .env → S3Provider (production / MinIO)
 *   - Otherwise                        → LocalProvider (dev / no S3 configured)
 *
 * MulterModule is registered here with explicit memoryStorage so that
 * FileInterceptor in StorageController always stores uploaded files in
 * memory (Buffer). Without this, multer may not initialise its storage
 * engine correctly when `storage: undefined` is passed to FileInterceptor.
 */
@Module({
  imports: [
    ConfigModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useFactory: (config: ConfigService) => {
        const hasBucket = !!config.get<string>('STORAGE_BUCKET');
        return hasBucket ? new S3Provider(config) : new LocalProvider(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
