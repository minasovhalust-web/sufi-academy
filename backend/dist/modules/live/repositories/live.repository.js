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
exports.LiveRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
let LiveRepository = class LiveRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkIsInstructor(courseId, userId) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { instructorId: true },
        });
        return course?.instructorId === userId;
    }
    async checkCourseAccess(courseId, userId) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { instructorId: true },
        });
        if (!course)
            return false;
        if (course.instructorId === userId)
            return true;
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            select: { status: true },
        });
        return (enrollment?.status === client_1.EnrollmentStatus.ACTIVE ||
            enrollment?.status === client_1.EnrollmentStatus.COMPLETED);
    }
    async createSession(data) {
        return this.prisma.liveSession.create({
            data: {
                title: data.title,
                host: { connect: { id: data.hostId } },
                course: { connect: { id: data.courseId } },
            },
            include: {
                host: { select: { id: true, firstName: true, lastName: true, email: true } },
                course: { select: { id: true, title: true, slug: true } },
            },
        });
    }
    async findSessionById(id) {
        return this.prisma.liveSession.findUnique({
            where: { id },
            include: {
                host: { select: { id: true, firstName: true, lastName: true, email: true } },
                course: { select: { id: true, title: true, slug: true } },
            },
        });
    }
    async findSessionsByCourse(courseId) {
        return this.prisma.liveSession.findMany({
            where: { courseId },
            include: {
                host: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { participants: { where: { leftAt: null } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateSession(id, data) {
        return this.prisma.liveSession.update({
            where: { id },
            data,
            include: {
                host: { select: { id: true, firstName: true, lastName: true, email: true } },
                course: { select: { id: true, title: true, slug: true } },
            },
        });
    }
    async findOrCreateParticipant(sessionId, userId, role) {
        return this.prisma.liveParticipant.upsert({
            where: { sessionId_userId: { sessionId, userId } },
            create: { sessionId, userId, role },
            update: { leftAt: null, role },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async findParticipant(sessionId, userId) {
        return this.prisma.liveParticipant.findUnique({
            where: { sessionId_userId: { sessionId, userId } },
        });
    }
    async findActiveParticipants(sessionId) {
        return this.prisma.liveParticipant.findMany({
            where: { sessionId, leftAt: null },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }
    async updateParticipant(sessionId, userId, data) {
        return this.prisma.liveParticipant.update({
            where: { sessionId_userId: { sessionId, userId } },
            data,
        });
    }
    async markParticipantLeft(sessionId, userId) {
        await this.prisma.liveParticipant.updateMany({
            where: { sessionId, userId, leftAt: null },
            data: { leftAt: new Date() },
        });
    }
};
exports.LiveRepository = LiveRepository;
exports.LiveRepository = LiveRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LiveRepository);
//# sourceMappingURL=live.repository.js.map