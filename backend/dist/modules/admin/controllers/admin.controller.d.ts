import { AdminService } from '../services/admin.service';
import { GetUsersDto } from '../dto/get-users.dto';
import { GetCoursesDto } from '../dto/get-courses.dto';
import { GetEnrollmentsDto } from '../dto/get-enrollments.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UpdateCourseStatusDto } from '../dto/update-course-status.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
    getUsers(query: GetUsersDto): Promise<import("../services/admin.service").PaginatedResult<any>>;
    getUserById(id: string): Promise<any>;
    updateUserRole(id: string, dto: UpdateUserRoleDto, requesterId: string): Promise<any>;
    updateUserStatus(id: string, dto: UpdateUserStatusDto, requesterId: string): Promise<any>;
    getCourses(query: GetCoursesDto): Promise<import("../services/admin.service").PaginatedResult<any>>;
    updateCourseStatus(id: string, dto: UpdateCourseStatusDto): Promise<any>;
    deleteCourse(id: string): Promise<void>;
    getEnrollments(query: GetEnrollmentsDto): Promise<import("../services/admin.service").PaginatedResult<any>>;
    approveEnrollment(id: string): Promise<any>;
    rejectEnrollment(id: string): Promise<any>;
}
