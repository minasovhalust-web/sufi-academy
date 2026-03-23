import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DirectMessagesController } from './controllers/direct-messages.controller';
import { DirectMessagesService } from './services/direct-messages.service';
import { DirectMessagesRepository } from './repositories/direct-messages.repository';

/**
 * DirectMessagesModule — Phase 8: 1-to-1 private messaging.
 *
 * Architecture:
 *   DirectMessagesController → DirectMessagesService → DirectMessagesRepository → Prisma
 *
 * The repository uses raw SQL (prisma.$queryRaw / prisma.$executeRaw) so it
 * works without re-running `prisma generate` on the dev machine.
 * Run `npx prisma migrate dev --name add_direct_messages` followed by
 * `npx prisma generate` on the target server to apply the schema change.
 *
 * REST endpoints (all JWT-protected):
 *   GET  /direct-messages           list conversations
 *   GET  /direct-messages/:userId   message history with a user
 *   POST /direct-messages/:userId   send a message
 */
@Module({
  imports: [PrismaModule],
  controllers: [DirectMessagesController],
  providers: [DirectMessagesService, DirectMessagesRepository],
})
export class DirectMessagesModule {}
