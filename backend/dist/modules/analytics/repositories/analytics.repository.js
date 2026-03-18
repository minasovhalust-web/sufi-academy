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
exports.AnalyticsRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
let AnalyticsRepository = class AnalyticsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createLog(input) {
        return this.prisma.activityLog.create({
            data: {
                event: input.event,
                actorId: input.actorId,
                subjectId: input.subjectId,
                subjectType: input.subjectType,
                metadata: input.metadata,
            },
        });
    }
    async countByEventType(range) {
        const result = await this.prisma.activityLog.groupBy({
            by: ['event'],
            where: { createdAt: { gte: range.from, lte: range.to } },
            _count: { event: true },
        });
        return result.map((r) => ({ event: r.event, count: r._count.event }));
    }
    async countByDay(range) {
        const rows = await this.prisma.$queryRaw `
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
      FROM activity_logs
      WHERE "createdAt" >= ${range.from} AND "createdAt" <= ${range.to}
      GROUP BY day
      ORDER BY day ASC
    `;
        return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
    }
    async courseStats(range) {
        const [enrollments, sessions] = await Promise.all([
            this.prisma.activityLog.count({
                where: {
                    event: client_1.ActivityEventType.STUDENT_ENROLLED,
                    createdAt: { gte: range.from, lte: range.to },
                },
            }),
            this.prisma.activityLog.count({
                where: {
                    event: client_1.ActivityEventType.LIVE_SESSION_STARTED,
                    createdAt: { gte: range.from, lte: range.to },
                },
            }),
        ]);
        return { enrollments, liveSessions: sessions };
    }
    async topActors(range, limit = 10) {
        const result = await this.prisma.activityLog.groupBy({
            by: ['actorId'],
            where: {
                actorId: { not: null },
                createdAt: { gte: range.from, lte: range.to },
            },
            _count: { actorId: true },
            orderBy: { _count: { actorId: 'desc' } },
            take: limit,
        });
        return result.map((r) => ({ actorId: r.actorId, count: r._count.actorId }));
    }
    async summary(range) {
        const [coursesCreated, studentsEnrolled, videosUploaded, messagesSent, sessionsStarted, sessionsEnded,] = await Promise.all([
            this.prisma.activityLog.count({
                where: { event: client_1.ActivityEventType.COURSE_CREATED, createdAt: { gte: range.from, lte: range.to } },
            }),
            this.prisma.activityLog.count({
                where: { event: client_1.ActivityEventType.STUDENT_ENROLLED, createdAt: { gte: range.from, lte: range.to } },
            }),
            this.prisma.activityLog.count({
                where: { event: client_1.ActivityEventType.VIDEO_UPLOADED, createdAt: { gte: range.from, lte: range.to } },
            }),
            this.prisma.activityLog.count({
                where: { event: client_1.ActivityEventType.CHAT_MESSAGE_SENT, createdAt: { gte: range.from, lte: range.to } },
            }),
            this.prisma.activityLog.count({
                where: { event: client_1.ActivityEventType.LIVE_SESSION_STARTED, createdAt: { gte: range.from, lte: range.to } },
            }),
            this.prisma.activityLog.count({
                where: { event: client_1.ActivityEventType.LIVE_SESSION_ENDED, createdAt: { gte: range.from, lte: range.to } },
            }),
        ]);
        return {
            coursesCreated,
            studentsEnrolled,
            videosUploaded,
            messagesSent,
            sessionsStarted,
            sessionsEnded,
        };
    }
};
exports.AnalyticsRepository = AnalyticsRepository;
exports.AnalyticsRepository = AnalyticsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsRepository);
//# sourceMappingURL=analytics.repository.js.map