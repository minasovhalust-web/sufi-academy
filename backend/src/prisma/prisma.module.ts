import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule is intentionally NOT decorated with @Global().
 *
 * Architecture decision (v2):
 * Every feature module that needs database access must explicitly import PrismaModule.
 * This makes dependency visibility clear — you can look at any module's imports array
 * and immediately know it touches the database.
 *
 * PrismaService is exported so it can be injected into repositories
 * within any module that imports PrismaModule.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
