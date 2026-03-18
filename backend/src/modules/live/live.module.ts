import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { LiveController } from './controllers/live.controller';
import { LiveService } from './services/live.service';
import { LiveRepository } from './repositories/live.repository';
import { LiveGateway } from './gateway/live.gateway';
import { WsJwtGuard } from './gateway/ws-jwt.guard';

/**
 * LiveModule — Phase 5: WebRTC-based live classes.
 *
 * Imports:
 * - PrismaModule: required by LiveRepository (not global).
 * - JwtModule: required by LiveGateway to verify tokens on WebSocket handshake.
 *   ConfigService is available globally (ConfigModule.forRoot({ isGlobal: true }))
 *   so it can be injected without importing ConfigModule here.
 *
 * Self-contained: no dependency on CoursesModule.
 *   Access checks (instructor verification, enrollment) are resolved in
 *   LiveRepository via direct Prisma queries on Course and Enrollment tables.
 *
 * Architecture:
 *   LiveGateway / LiveController → LiveService → LiveRepository → Prisma
 *
 * WebSocket namespace: /live
 * Socket.io room key: "live:{sessionId}"
 *
 * WebRTC signaling:
 *   The gateway relays SDP offer/answer and ICE candidates between peers.
 *   No media data flows through the server.
 *   Peer targeting uses the in-memory userSockets Map (userId → socketId).
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [LiveController],
  providers: [LiveGateway, LiveService, LiveRepository, WsJwtGuard],
})
export class LiveModule {}
