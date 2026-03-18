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
exports.AdminRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const USER_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    bio: true,
    avatarUrl: true,
    specialization: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            enrollments: true,
            taughtCourses: true,
        },
    },
};
const COURSE_SELECT = {
    id: true,
    title: true,
    slug: true,
    description: true,
    status: true,
    instructorId: true,
    createdAt: true,
    updatedAt: true,
    instructor: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    },
    _count: {
        select: {
            enrollments: true,
            modules: true,
        },
    },
};
const ENROLLMENT_USER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
};
const ENROLLMENT_COURSE_SELECT = {
    id: true,
    title: true,
    slug: true,
    status: true,
};
let AdminRepository = class AdminRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findUsers(filters) {
        const where = this.buildUserWhere(filters);
        return this.prisma.user.findMany({
            where,
            select: USER_SELECT,
            orderBy: { createdAt: 'desc' },
            skip: filters.skip,
            take: filters.take,
        });
    }
    async countUsers(filters) {
        return this.prisma.user.count({
            where: this.buildUserWhere(filters),
        });
    }
    async findUserById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                ...USER_SELECT,
                enrollments: {
                    select: {
                        id: true,
                        status: true,
                        progress: true,
                        enrolledAt: true,
                        course: {
                            select: { id: true, title: true, slug: true, status: true },
                        },
                    },
                    orderBy: { enrolledAt: 'desc' },
                    take: 10,
                },
                taughtCourses: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true,
                        createdAt: true,
                        _count: { select: { enrollments: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
    }
    async updateUserRole(id, role) {
        return this.prisma.user.update({
            where: { id },
            data: { role },
            select: USER_SELECT,
        });
    }
    async updateUserStatus(id, isActive) {
        return this.prisma.user.update({
            where: { id },
            data: { isActive },
            select: USER_SELECT,
        });
    }
    async findCourses(filters) {
        const where = this.buildCourseWhere(filters);
        return this.prisma.course.findMany({
            where,
            select: COURSE_SELECT,
            orderBy: { createdAt: 'desc' },
            skip: filters.skip,
            take: filters.take,
        });
    }
    async countCourses(filters) {
        return this.prisma.course.count({
            where: this.buildCourseWhere(filters),
        });
    }
    async findCourseById(id) {
        return this.prisma.course.findUnique({
            where: { id },
            select: COURSE_SELECT,
        });
    }
    async updateCourseStatus(id, status) {
        return this.prisma.course.update({
            where: { id },
            data: { status },
            select: COURSE_SELECT,
        });
    }
    async deleteCourse(id) {
        await this.prisma.course.delete({ where: { id } });
    }
    async findEnrollments(filters) {
        const where = {};
        if (filters.status !== undefined) {
            where.status = filters.status;
        }
        return this.prisma.enrollment.findMany({
            where,
            include: {
                user: { select: ENROLLMENT_USER_SELECT },
                course: { select: ENROLLMENT_COURSE_SELECT },
            },
            orderBy: { enrolledAt: 'desc' },
            skip: filters.skip,
            take: filters.take,
        });
    }
    async countEnrollments(filters) {
        const where = {};
        if (filters.status !== undefined) {
            where.status = filters.status;
        }
        return this.prisma.enrollment.count({ where });
    }
    async findEnrollmentById(id) {
        return this.prisma.enrollment.findUnique({
            where: { id },
            include: {
                user: { select: ENROLLMENT_USER_SELECT },
                course: { select: ENROLLMENT_COURSE_SELECT },
            },
        });
    }
    async updateEnrollmentStatus(id, status) {
        return this.prisma.enrollment.update({
            where: { id },
            data: { status },
            include: {
                user: { select: ENROLLMENT_USER_SELECT },
                course: { select: { id: true, title: true, slug: true } },
            },
        });
    }
    async getDashboardStats() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const [totalUsers, totalCourses, totalEnrollments, activeLiveSessions, newUsersLast7Days, usersByRole, coursesByStatus,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.course.count(),
            this.prisma.enrollment.count(),
            this.prisma.liveSession.count({ where: { status: 'LIVE' } }),
            this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            this.prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
            this.prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
        ]);
        return {
            totalUsers,
            totalCourses,
            totalEnrollments,
            activeLiveSessions,
            newUsersLast7Days,
            usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count.role])),
            coursesByStatus: Object.fromEntries(coursesByStatus.map((r) => [r.status, r._count.status])),
        };
    }
    buildUserWhere(filters) {
        const where = {};
        if (filters.role !== undefined)
            where.role = filters.role;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.search) {
            const term = filters.search.trim();
            where.OR = [
                { email: { contains: term, mode: 'insensitive' } },
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    buildCourseWhere(filters) {
        const where = {};
        if (filters.status !== undefined)
            where.status = filters.status;
        if (filters.teacherId)
            where.instructorId = filters.teacherId;
        if (filters.search) {
            const term = filters.search.trim();
            where.OR = [
                { title: { contains: term, mode: 'insensitive' } },
                { slug: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
            ];
        }
        return where;
    }
};
exports.AdminRepository = AdminRepository;
exports.AdminRepository = AdminRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminRepository);
//# sourceMappingURL=admin.repository.js.map