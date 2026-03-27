"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectMessagesRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
function rowToMessage(row) {
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
let DirectMessagesRepository = class DirectMessagesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findConversations(userId) {
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
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
        const map = new Map();
        for (const row of rows) {
            const partnerId = row.senderId === userId ? row.receiverId : row.senderId;
            if (!map.has(partnerId)) {
                const msg = rowToMessage(row);
                const partnerUser = row.senderId === userId ? msg.receiver : msg.sender;
                map.set(partnerId, { user: partnerUser, lastMessage: msg });
            }
        }
        return Array.from(map.values());
    }
    async findMessages(userId, otherId, limit) {
        const safeLimit = Math.min(Math.max(1, limit), 100);
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
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
      LIMIT ${client_1.Prisma.raw(String(safeLimit))}
    `);
        return rows.map(rowToMessage);
    }
    async createMessage(senderId, receiverId, content) {
        const id = (0, crypto_1.randomUUID)();
        await this.prisma.$executeRaw(client_1.Prisma.sql `
      INSERT INTO direct_messages (id, content, "senderId", "receiverId", "createdAt")
      VALUES (${id}, ${content}, ${senderId}, ${receiverId}, NOW())
    `);
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
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
    async receiverExists(userId) {
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT COUNT(*) AS count
      FROM users
      WHERE id = ${userId} AND "isActive" = true
    `);
        return Number(rows[0]?.count ?? 0) > 0;
    }
};
exports.DirectMessagesRepository = DirectMessagesRepository;
exports.DirectMessagesRepository = DirectMessagesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DirectMessagesRepository);
//# sourceMappingURL=direct-messages.repository.js.map