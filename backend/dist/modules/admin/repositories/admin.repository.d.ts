import { CourseStatus, EnrollmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
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
export declare class AdminRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findUsers(filters: UserFilters): Promise<{
        _count: {
            enrollments: number;
            taughtCourses: number;
        };
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        bio: string;
        avatarUrl: string;
        specialization: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    countUsers(filters: Pick<UserFilters, 'role' | 'isActive' | 'search'>): Promise<number>;
    findUserById(id: string): Promise<{
        _count: {
            enrollments: number;
            taughtCourses: number;
        };
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        bio: string;
        avatarUrl: string;
        specialization: string;
        createdAt: Date;
        updatedAt: Date;
        enrollments: {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            progress: number;
            enrolledAt: Date;
            course: {
                id: string;
                title: string;
                slug: string;
                status: import(".prisma/client").$Enums.CourseStatus;
            };
        }[];
        taughtCourses: {
            _count: {
                enrollments: number;
            };
            id: string;
            createdAt: Date;
            title: string;
            slug: string;
            status: import(".prisma/client").$Enums.CourseStatus;
        }[];
    }>;
    updateUserRole(id: string, role: Role): Promise<{
        _count: {
            enrollments: number;
            taughtCourses: number;
        };
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        bio: string;
        avatarUrl: string;
        specialization: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUserStatus(id: string, isActive: boolean): Promise<{
        _count: {
            enrollments: number;
            taughtCourses: number;
        };
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        bio: string;
        avatarUrl: string;
        specialization: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findCourses(filters: CourseFilters): Promise<{
        _count: {
            enrollments: number;
            modules: number;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        slug: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        instructorId: string;
        instructor: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }[]>;
    countCourses(filters: Pick<CourseFilters, 'status' | 'teacherId' | 'search'>): Promise<number>;
    findCourseById(id: string): Promise<{
        _count: {
            enrollments: number;
            modules: number;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        slug: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        instructorId: string;
        instructor: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    updateCourseStatus(id: string, status: CourseStatus): Promise<{
        _count: {
            enrollments: number;
            modules: number;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        slug: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        instructorId: string;
        instructor: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    deleteCourse(id: string): Promise<void>;
    findEnrollments(filters: EnrollmentFilters): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        course: {
            id: string;
            title: string;
            slug: string;
            status: import(".prisma/client").$Enums.CourseStatus;
        };
    } & {
        id: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        progress: number;
        userId: string;
        courseId: string;
        enrolledAt: Date;
    })[]>;
    countEnrollments(filters: Pick<EnrollmentFilters, 'status'>): Promise<number>;
    findEnrollmentById(id: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        course: {
            id: string;
            title: string;
            slug: string;
            status: import(".prisma/client").$Enums.CourseStatus;
        };
    } & {
        id: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        progress: number;
        userId: string;
        courseId: string;
        enrolledAt: Date;
    }>;
    updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        course: {
            id: string;
            title: string;
            slug: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        progress: number;
        userId: string;
        courseId: string;
        enrolledAt: Date;
    }>;
    getDashboardStats(): Promise<{
        totalUsers: number;
        totalCourses: number;
        totalEnrollments: number;
        activeLiveSessions: number;
        newUsersLast7Days: number;
        usersByRole: {
            [k: string]: number;
        };
        coursesByStatus: {
            [k: string]: number;
        };
    }>;
    private buildUserWhere;
    private buildCourseWhere;
}
