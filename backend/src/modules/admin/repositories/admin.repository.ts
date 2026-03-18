import { Injectable } from '@nestjs/common';
import { CourseStatus, EnrollmentStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

// ── Filter shapes ────────────────────────────────────────────────────────────

export interface UserFilters {
  role?: Role;
  isActive?: boolean;
  search?: string;
  skip: number;
  take: number;
}

export interface CourseFilters {
  status?: CourseStatus;
  teacherId?: string;
  search?: string;
  skip: number;
  take: number;
}

export interface EnrollmentFilters {
  status?: string;
  skip: number;
  take: number;
}

// ── Return shapes (avoid leaking password) ───────────────────────────────────

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
} as const;

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
} as const;

const ENROLLMENT_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const ENROLLMENT_COURSE_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
} as const;

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── User queries ─────────────────────────────────────────────────────────────

  async findUsers(filters: UserFilters) {
    const where = this.buildUserWhere(filters);
    return this.prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: filters.skip,
      take: filters.take,
    });
  }

  async countUsers(filters: Pick<UserFilters, 'role' | 'isActive' | 'search'>) {
    return this.prisma.user.count({
      where: this.buildUserWhere(filters),
    });
  }

  async findUserById(id: string) {
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

  async updateUserRole(id: string, role: Role) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: USER_SELECT,
    });
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: USER_SELECT,
    });
  }

  // ── Course queries ───────────────────────────────────────────────────────────

  async findCourses(filters: CourseFilters) {
    const where = this.buildCourseWhere(filters);
    return this.prisma.course.findMany({
      where,
      select: COURSE_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: filters.skip,
      take: filters.take,
    });
  }

  async countCourses(
    filters: Pick<CourseFilters, 'status' | 'teacherId' | 'search'>,
  ) {
    return this.prisma.course.count({
      where: this.buildCourseWhere(filters),
    });
  }

  async findCourseById(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      select: COURSE_SELECT,
    });
  }

  async updateCourseStatus(id: string, status: CourseStatus) {
    return this.prisma.course.update({
      where: { id },
      data: { status },
      select: COURSE_SELECT,
    });
  }

  async deleteCourse(id: string): Promise<void> {
    await this.prisma.course.delete({ where: { id } });
  }

  // ── Enrollment queries ────────────────────────────────────────────────────────

  async findEnrollments(filters: EnrollmentFilters) {
    const where: Prisma.EnrollmentWhereInput = {};
    if (filters.status !== undefined) {
      where.status = filters.status as EnrollmentStatus;
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

  async countEnrollments(filters: Pick<EnrollmentFilters, 'status'>) {
    const where: Prisma.EnrollmentWhereInput = {};
    if (filters.status !== undefined) {
      where.status = filters.status as EnrollmentStatus;
    }
    return this.prisma.enrollment.count({ where });
  }

  async findEnrollmentById(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: { select: ENROLLMENT_USER_SELECT },
        course: { select: ENROLLMENT_COURSE_SELECT },
      },
    });
  }

  async updateEnrollmentStatus(id: string, status: EnrollmentStatus) {
    return this.prisma.enrollment.update({
      where: { id },
      data: { status },
      include: {
        user: { select: ENROLLMENT_USER_SELECT },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  // ── Dashboard stats ──────────────────────────────────────────────────────────

  async getDashboardStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeLiveSessions,
      newUsersLast7Days,
      usersByRole,
      coursesByStatus,
    ] = await Promise.all([
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
      usersByRole: Object.fromEntries(
        usersByRole.map((r) => [r.role, r._count.role]),
      ),
      coursesByStatus: Object.fromEntries(
        coursesByStatus.map((r) => [r.status, r._count.status]),
      ),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private buildUserWhere(
    filters: Pick<UserFilters, 'role' | 'isActive' | 'search'>,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    if (filters.role !== undefined) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
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

  private buildCourseWhere(
    filters: Pick<CourseFilters, 'status' | 'teacherId' | 'search'>,
  ): Prisma.CourseWhereInput {
    const where: Prisma.CourseWhereInput = {};
    if (filters.status !== undefined) where.status = filters.status;
    if (filters.teacherId) where.instructorId = filters.teacherId;
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
}
