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
exports.ScheduleRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let ScheduleRepository = class ScheduleRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const id = (0, crypto_1.randomUUID)();
        await this.prisma.$executeRaw(client_1.Prisma.sql `
        INSERT INTO "scheduled_lessons" ("id","title","description","scheduledAt","courseId","lessonId","createdAt")
        VALUES (
          ${id},
          ${data.title},
          ${data.description ?? null},
          ${data.scheduledAt},
          ${data.courseId},
          ${data.lessonId ?? null},
          NOW()
        )
      `);
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT * FROM "scheduled_lessons" WHERE "id" = ${id}`);
        return rows[0];
    }
    async findByCourse(courseId) {
        return this.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT * FROM "scheduled_lessons"
        WHERE "courseId" = ${courseId}
        ORDER BY "scheduledAt" ASC
      `);
    }
    async findUpcomingForUser(userId) {
        return this.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT sl.*, c."title" AS "courseTitle"
        FROM "scheduled_lessons" sl
        JOIN "courses" c ON c."id" = sl."courseId"
        JOIN "enrollments" e ON e."courseId" = sl."courseId"
          AND e."userId" = ${userId}
          AND e."status" = 'ACTIVE'
        ORDER BY sl."scheduledAt" ASC
      `);
    }
    async findForInstructor(instructorId) {
        return this.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT sl.*, c."title" AS "courseTitle"
        FROM "scheduled_lessons" sl
        JOIN "courses" c ON c."id" = sl."courseId"
          AND c."instructorId" = ${instructorId}
        ORDER BY sl."scheduledAt" ASC
      `);
    }
    async findById(id) {
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT * FROM "scheduled_lessons" WHERE "id" = ${id}`);
        return rows[0] ?? null;
    }
    async delete(id) {
        await this.prisma.$executeRaw(client_1.Prisma.sql `DELETE FROM "scheduled_lessons" WHERE "id" = ${id}`);
    }
};
exports.ScheduleRepository = ScheduleRepository;
exports.ScheduleRepository = ScheduleRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScheduleRepository);
//# sourceMappingURL=schedule.repository.js.map