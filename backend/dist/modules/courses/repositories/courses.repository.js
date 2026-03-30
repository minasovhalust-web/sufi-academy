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
exports.CoursesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CoursesRepository = class CoursesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.course.create({ data });
    }
    async findAll(filters) {
        const courses = await this.prisma.course.findMany({
            where: filters,
            include: {
                instructor: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                _count: {
                    select: { enrollments: true, modules: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (courses.length === 0)
            return courses;
        const ids = courses.map((c) => c.id);
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT "id", "imageUrl" FROM "courses" WHERE "id" IN (${client_1.Prisma.join(ids)})`);
        const urlMap = new Map(rows.map((r) => [r.id, r.imageUrl]));
        return courses.map((c) => ({ ...c, imageUrl: urlMap.get(c.id) ?? null }));
    }
    async findById(id) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                modules: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: { orderBy: { order: 'asc' } },
                    },
                },
                _count: {
                    select: { enrollments: true, modules: true },
                },
            },
        });
        if (!course)
            return null;
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT "imageUrl" FROM "courses" WHERE "id" = ${id}`);
        course.imageUrl = rows[0]?.imageUrl ?? null;
        return course;
    }
    async findBySlug(slug) {
        return this.prisma.course.findUnique({ where: { slug } });
    }
    async update(id, data) {
        return this.prisma.course.update({ where: { id }, data });
    }
    async delete(id) {
        await this.prisma.course.delete({ where: { id } });
    }
    async updateImageUrl(id, imageUrl) {
        await this.prisma.$executeRaw(client_1.Prisma.sql `UPDATE "courses" SET "imageUrl" = ${imageUrl}, "updatedAt" = NOW() WHERE "id" = ${id}`);
    }
};
exports.CoursesRepository = CoursesRepository;
exports.CoursesRepository = CoursesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoursesRepository);
//# sourceMappingURL=courses.repository.js.map