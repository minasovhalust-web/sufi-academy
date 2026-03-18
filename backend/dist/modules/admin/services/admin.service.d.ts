import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminRepository } from '../repositories/admin.repository';
import { GetUsersDto } from '../dto/get-users.dto';
import { GetCoursesDto } from '../dto/get-courses.dto';
import { GetEnrollmentsDto } from '../dto/get-enrollments.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UpdateCourseStatusDto } from '../dto/update-course-status.dto';
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class AdminService {
    private readonly adminRepository;
    private readonly eventEmitter;
    constructor(adminRepository: AdminRepository, eventEmitter: EventEmitter2);
    getDashboard(): Promise<{
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
    getUsers(query: GetUsersDto): Promise<PaginatedResult<any>>;
    getUserById(id: string): Promise<any>;
    updateUserRole(id: string, dto: UpdateUserRoleDto, requesterId: string): Promise<any>;
    updateUserStatus(id: string, dto: UpdateUserStatusDto, requesterId: string): Promise<any>;
    getCourses(query: GetCoursesDto): Promise<PaginatedResult<any>>;
    updateCourseStatus(id: string, dto: UpdateCourseStatusDto): Promise<any>;
    deleteCourse(id: string): Promise<void>;
    getEnrollments(query: GetEnrollmentsDto): Promise<PaginatedResult<any>>;
    approveEnrollment(id: string): Promise<any>;
    rejectEnrollment(id: string): Promise<any>;
}
