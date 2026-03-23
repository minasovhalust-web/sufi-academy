import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DirectMessageUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface DirectMessageWithUsers {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  sender: DirectMessageUser;
  receiver: DirectMessageUser;
}

/** Raw row returned by the SQL JOIN queries. */
interface RawDmRow {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  senderFirstName: string;
  senderLastName: string;
  senderAvatarUrl: string | null;
  receiverFirstName: string;
  receiverLastName: string;
  receiverAvatarUrl: string | null;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function rowToMessage(row: RawDmRow): DirectMessageWithUsers {
  return {
    id: row.id,
    content: row.content,
    senderId: row.senderId,
    receiverId: row.receiverId,
    createdAt: row.createdAt,
    sender: {
      id: row.senderId,
      firstName: row.senderFirstName,
      lastName: row.senderLastName,
      avatarUrl: row.senderAvatarUrl,
    },
    receiver: {
      id: row.receiverId,
      firstName: row.receiverFirstName,
      lastName: row.receiverLastName,
      avatarUrl: row.receiverAvatarUrl,
    },
  };
}

// ── Repository ────────────────────────────────────────────────────────────────

/**
 * DirectMessagesRepository
 *
 * Uses raw SQL via prisma.$queryRaw so it works independently of whether
 * `prisma generate` has been re-run to include the DirectMessage model.
 * Run `npx prisma generate` on the server to get typed Prisma model methods.
 */
@Injectable()
export class DirectMessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the list of conversations for a user.
   * Each entry holds the conversation partner's profile and the most recent message.
   */
  async findConversations(userId: string): Promise<
    { user: DirectMessageUser; lastMessage: DirectMessageWithUsers }[]
  > {
    // Fetch recent messages (both directions) and group by partner in Node.js.
    // 500 is more than enough for any real-world academy's message volume.
    const rows = await this.prisma.$queryRaw<RawDmRow[]>(Prisma.sql`
      SELECT
        dm.id,
        dm.content,
        dm."senderId",
        dm."receiverId",
        dm."createdAt",
        s."firstName"  AS "senderFirstName",
        s."lastName"   AS "senderLastName",
        s."avatarUrl"  AS "senderAvatarUrl",
        r."firstName"  AS "receiverFirstName",
        r."lastName"   AS "receiverLastName",
        r."avatarUrl"  AS "receiverAvatarUrl"
      FROM direct_messages dm
      JOIN users s ON s.id = dm."senderId"
      JOIN users r ON r.id = dm."receiverId"
      WHERE dm."senderId" = ${userId}
         OR dm."receiverId" = ${userId}
      ORDER BY dm."createdAt" DESC
      LIMIT 500
    `);

    // Group by partner, keeping only the first (most recent) message per partner.
    const map = new Map<
      string,
      { user: DirectMessageUser; lastMessage: DirectMessageWithUsers }
    >();

    for (const row of rows) {
      const partnerId =
        row.senderId === userId ? row.receiverId : row.senderId;

      if (!map.has(partnerId)) {
        const msg = rowToMessage(row);
        const partnerUser =
          row.senderId === userId ? msg.receiver : msg.sender;
        map.set(partnerId, { user: partnerUser, lastMessage: msg });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Returns the message history between two users in chronological order.
   */
  async findMessages(
    userId: string,
    otherId: string,
    limit: number,
  ): Promise<DirectMessageWithUsers[]> {
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const rows = await this.prisma.$queryRaw<RawDmRow[]>(Prisma.sql`
      SELECT
        dm.id,
        dm.content,
        dm."senderId",
        dm."receiverId",
        dm."createdAt",
        s."firstName"  AS "senderFirstName",
        s."lastName"   AS "senderLastName",
        s."avatarUrl"  AS "senderAvatarUrl",
        r."firstName"  AS "receiverFirstName",
        r."lastName"   AS "receiverLastName",
        r."avatarUrl"  AS "receiverAvatarUrl"
      FROM direct_messages dm
      JOIN users s ON s.id = dm."senderId"
      JOIN users r ON r.id = dm."receiverId"
      WHERE (dm."senderId" = ${userId} AND dm."receiverId" = ${otherId})
         OR (dm."senderId" = ${otherId} AND dm."receiverId" = ${userId})
      ORDER BY dm."createdAt" ASC
      LIMIT ${Prisma.raw(String(safeLimit))}
    `);

    return rows.map(rowToMessage);
  }

  /**
   * Persists a new direct message and returns it with full user relations.
   */
  async createMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<DirectMessageWithUsers> {
    const id = randomUUID();

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO direct_messages (id, content, "senderId", "receiverId", "createdAt")
      VALUES (${id}, ${content}, ${senderId}, ${receiverId}, NOW())
    `);

    const rows = await this.prisma.$queryRaw<RawDmRow[]>(Prisma.sql`
      SELECT
        dm.id,
        dm.content,
        dm."senderId",
        dm."receiverId",
        dm."createdAt",
        s."firstName"  AS "senderFirstName",
        s."lastName"   AS "senderLastName",
        s."avatarUrl"  AS "senderAvatarUrl",
        r."firstName"  AS "receiverFirstName",
        r."lastName"   AS "receiverLastName",
        r."avatarUrl"  AS "receiverAvatarUrl"
      FROM direct_messages dm
      JOIN users s ON s.id = dm."senderId"
      JOIN users r ON r.id = dm."receiverId"
      WHERE dm.id = ${id}
    `);

    return rowToMessage(rows[0]);
  }

  /** Returns true if a user with this id exists and is active. */
  async receiverExists(userId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) AS count
      FROM users
      WHERE id = ${userId} AND "isActive" = true
    `);
    return Number(rows[0]?.count ?? 0) > 0;
  }
}
