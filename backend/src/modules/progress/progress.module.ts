import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressRepository],
  exports: [ProgressService, ProgressRepository],
})
export class ProgressModule {}
