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
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        bio: string;
        avatarUrl: string;
        specialization: string;
        _count: {
            taughtCourses: number;
            enrollments: number;
        };
    }[]>;
    countUsers(filters: Pick<UserFilters, 'role' | 'isActive' | 'search'>): Promise<number>;
    findUserById(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        bio: string;
        avatarUrl: string;
        specialization: string;
        taughtCourses: {
            id: string;
            createdAt: Date;
            _count: {
                enrollments: number;
            };
            title: string;
            slug: string;
            status: import(".prisma/client").$Enums.CourseStatus;
        }[];
        enrollments: {
            course: {
                id: string;
                title: string;
                slug: string;
                status: import(".prisma/client").$Enums.CourseStatus;
            };
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            progress: number;
            enrolledAt: Date;
        }[];
        _count: {
            taughtCourses: number;
            enrollments: number;
        };
    }>;
    updateUserRole(id: string, role: Role): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        bio: string;
        avatarUrl: string;
        specialization: string;
        _count: {
            taughtCourses: number;
            enrollments: number;
        };
    }>;
    updateUserStatus(id: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        bio: string;
        avatarUrl: string;
        specialization: string;
        _count: {
            taughtCourses: number;
            enrollments: number;
        };
    }>;
    findCourses(filters: CourseFilters): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            enrollments: number;
            modules: number;
        };
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            enrollments: number;
            modules: number;
        };
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            enrollments: number;
            modules: number;
        };
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
        userId: string;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        courseId: string;
        progress: number;
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
        userId: string;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        courseId: string;
        progress: number;
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
        userId: string;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        courseId: string;
        progress: number;
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
