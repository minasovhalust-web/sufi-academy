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
exports.VideosRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let VideosRepository = class VideosRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.video.create({ data });
    }
    async findById(id) {
        return this.prisma.video.findUnique({ where: { id } });
    }
    async findByLesson(lessonId) {
        return this.prisma.video.findMany({
            where: { lessonId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findByStorageKey(storageKey) {
        return this.prisma.video.findUnique({ where: { storageKey } });
    }
    async update(id, data) {
        return this.prisma.video.update({ where: { id }, data });
    }
    async delete(id) {
        return this.prisma.video.delete({ where: { id } });
    }
    async findLessonInstructorId(lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                module: {
                    select: {
                        course: { select: { instructorId: true } },
                    },
                },
            },
        });
        return lesson?.module?.course?.instructorId ?? null;
    }
};
exports.VideosRepository = VideosRepository;
exports.VideosRepository = VideosRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VideosRepository);
//# sourceMappingURL=videos.repository.js.map