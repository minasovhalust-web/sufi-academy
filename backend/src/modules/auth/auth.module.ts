import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthTokenRepository } from './repositories/auth-token.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

/**
 * AuthModule wires together the authentication system.
 *
 * Imports:
 * - PrismaModule: required explicitly for AuthTokenRepository.
 * - UsersModule: imports UsersService (the one allowed cross-module export)
 *   to validate credentials during login and to create users during registration.
 * - PassportModule: registers passport with 'jwt' as the default strategy.
 * - JwtModule: registered with no default secret — each sign/verify call
 *   in AuthService passes its own secret explicitly. This allows using
 *   different secrets for access vs. refresh tokens.
 *
 * Exports:
 * - Nothing. Auth is a consumer, not a provider.
 *   Other modules use guards/decorators from common/, not AuthService directly.
 *
 * JwtStrategy and JwtRefreshStrategy are registered as providers so
 * Passport can discover them by their strategy names ('jwt', 'jwt-refresh').
 */
@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // No default secret — secrets passed per-call in AuthService
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenRepository,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [],
})
export class AuthModule {}
