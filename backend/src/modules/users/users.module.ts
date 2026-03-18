import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';

/**
 * UsersModule encapsulates everything related to user management.
 *
 * Imports:
 * - PrismaModule: required explicitly (not global) for UsersRepository.
 *
 * Exports:
 * - UsersService: exported so AuthModule can use it during login and
 *   registration without bypassing the service layer.
 *   This is one of two allowed cross-module service exports (see architecture doc).
 *
 * UsersRepository is NOT exported — it is an internal implementation detail.
 * External modules access user data only through UsersService.
 */
@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
