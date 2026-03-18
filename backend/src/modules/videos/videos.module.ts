import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { VideosController } from './controllers/videos.controller';
import { VideosService } from './services/videos.service';
import { VideosRepository } from './repositories/videos.repository';

/**
 * VideosModule — Phase 3.
 *
 * Manages video records linked to lessons.
 * All file I/O goes through S3 via pre-signed URLs — no video data
 * flows through the application server.
 *
 * Imports:
 * - PrismaModule: required by VideosRepository (not global).
 * - StorageModule: provides the STORAGE_SERVICE token consumed by VideosService.
 *
 * Self-contained: no dependency on CoursesModule.
 * Ownership checks (instructor auth) are resolved inside VideosRepository
 * by traversing lesson → module → course via a single Prisma query.
 */
@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [VideosController],
  providers: [VideosService, VideosRepository],
})
export class VideosModule {}
