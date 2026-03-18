import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminRepository } from './repositories/admin.repository';

/**
 * AdminModule — platform administration panel.
 *
 * Architecture:
 *   AdminController → AdminService → AdminRepository → Prisma
 *
 * Self-contained: AdminRepository queries any table it needs directly
 * (User, Course, Enrollment, LiveSession) without importing other feature modules.
 * All endpoints are ADMIN-only (enforced via @Roles at the controller class level).
 */
@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
})
export class AdminModule {}
