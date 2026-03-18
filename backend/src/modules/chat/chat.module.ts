import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { ChatRepository } from './repositories/chat.repository';
import { ChatGateway } from './gateway/chat.gateway';
import { WsJwtGuard } from './gateway/ws-jwt.guard';
import { ChatListener } from './listeners/chat.listener';

/**
 * ChatModule — Phase 4: real-time course chat via Socket.IO.
 *
 * Imports:
 * - PrismaModule: required by ChatRepository (not global).
 * - JwtModule: required by ChatGateway to verify tokens on WS handshake.
 *   ConfigModule is global, so ConfigService is injected without importing it here.
 *
 * Self-contained: no dependency on CoursesModule.
 *   Access checks (enrollment + instructor) are resolved in ChatRepository
 *   via direct Prisma queries on Course and Enrollment tables.
 *
 * Architecture:
 *   ChatGateway / ChatController → ChatService → ChatRepository → Prisma
 *
 * WebSocket namespace: /chat
 * Socket.io room key: "course:{courseId}"
 */
@Module({
  imports: [
    PrismaModule,
    // JwtModule is needed by ChatGateway to manually verify tokens
    // during the WebSocket handshake (no HTTP guards available at connection time).
    // Secret must match the JWT_SECRET used in AuthModule.
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatRepository,
    WsJwtGuard,
    ChatListener,
  ],
})
export class ChatModule {}
