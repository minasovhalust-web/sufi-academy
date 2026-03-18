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
exports.ChatRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const chat_message_entity_1 = require("../entities/chat-message.entity");
const MESSAGE_INCLUDE = {
    sender: { select: { id: true, firstName: true, lastName: true } },
    replyTo: {
        select: {
            id: true,
            content: true,
            sender: { select: { id: true, firstName: true, lastName: true } },
        },
    },
};
let ChatRepository = class ChatRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkUserAccess(courseId, userId) {
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
        return enrollment?.status === chat_message_entity_1.EnrollmentStatus.ACTIVE;
    }
    async findRoomByCourse(courseId) {
        return this.prisma.chatRoom.findUnique({ where: { courseId } });
    }
    async findOrCreateRoom(courseId) {
        return this.prisma.chatRoom.upsert({
            where: { courseId },
            create: { courseId },
            update: {},
        });
    }
    async findMessages(roomId, options) {
        const { cursor, limit } = options;
        let cursorDate;
        if (cursor) {
            const pivot = await this.prisma.chatMessage.findUnique({
                where: { id: cursor },
                select: { createdAt: true },
            });
            cursorDate = pivot?.createdAt;
        }
        return this.prisma.chatMessage.findMany({
            where: {
                roomId,
                ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
            },
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async countMessages(roomId) {
        return this.prisma.chatMessage.count({ where: { roomId } });
    }
    async createMessage(data) {
        return this.prisma.chatMessage.create({
            data: {
                content: data.content,
                room: { connect: { id: data.roomId } },
                sender: { connect: { id: data.senderId } },
                ...(data.replyToId ? { replyTo: { connect: { id: data.replyToId } } } : {}),
            },
            include: MESSAGE_INCLUDE,
        });
    }
    async findMessage(id) {
        return this.prisma.chatMessage.findUnique({ where: { id } });
    }
    async softDeleteMessage(id) {
        return this.prisma.chatMessage.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: MESSAGE_INCLUDE,
        });
    }
};
exports.ChatRepository = ChatRepository;
exports.ChatRepository = ChatRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatRepository);
//# sourceMappingURL=chat.repository.js.map