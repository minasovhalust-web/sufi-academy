import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from '@prisma/client';
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

/**
 * AdminService — business logic for platform administration.
 *
 * Rules:
 *   - All operations restricted to ADMIN role (enforced in the controller).
 *   - Emits EventEmitter2 events where domain logic requires it.
 *   - Never imports Prisma — all DB access goes through AdminRepository.
 *   - AdminModule does NOT import other feature modules; it queries directly.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Dashboard ────────────────────────────────────────────────────────────────

  async getDashboard() {
    return this.adminRepository.getDashboardStats();
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  async getUsers(query: GetUsersDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.adminRepository.findUsers({
        role: query.role,
        isActive: query.isActive,
        search: query.search,
        skip,
        take: limit,
      }),
      this.adminRepository.countUsers({
        role: query.role,
        isActive: query.isActive,
        search: query.search,
      }),
    ]);

    return { data, total, page, limit, hasMore: skip + data.length < total };
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async updateUserRole(
    id: string,
    dto: UpdateUserRoleDto,
    requesterId: string,
  ): Promise<any> {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (id === requesterId && dto.role !== Role.ADMIN) {
      throw new BadRequestException(
        'Admins cannot change their own role to a lower privilege',
      );
    }

    const updated = await this.adminRepository.updateUserRole(id, dto.role);

    if (dto.role === Role.TEACHER && user.role !== Role.TEACHER) {
      this.eventEmitter.emit('admin.teacher.assigned', {
        userId: id,
        assignedById: requesterId,
      });
    }

    return updated;
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto, requesterId: string): Promise<any> {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (id === requesterId && !dto.isActive) {
      throw new BadRequestException('Admins cannot deactivate their own account');
    }

    return this.adminRepository.updateUserStatus(id, dto.isActive);
  }

  // ── Courses ──────────────────────────────────────────────────────────────────

  async getCourses(query: GetCoursesDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.adminRepository.findCourses({
        status: query.status,
        teacherId: query.teacherId,
        search: query.search,
        skip,
        take: limit,
      }),
      this.adminRepository.countCourses({
        status: query.status,
        teacherId: query.teacherId,
        search: query.search,
      }),
    ]);

    return { data, total, page, limit, hasMore: skip + data.length < total };
  }

  async updateCourseStatus(id: string, dto: UpdateCourseStatusDto): Promise<any> {
    const course = await this.adminRepository.findCourseById(id);
    if (!course) throw new NotFoundException(`Course #${id} not found`);
    return this.adminRepository.updateCourseStatus(id, dto.status);
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.adminRepository.findCourseById(id);
    if (!course) throw new NotFoundException(`Course #${id} not found`);
    await this.adminRepository.deleteCourse(id);
  }

  // ── Enrollments ───────────────────────────────────────────────────────────────

  async getEnrollments(query: GetEnrollmentsDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.adminRepository.findEnrollments({
        status: query.status,
        skip,
        take: limit,
      }),
      this.adminRepository.countEnrollments({ status: query.status }),
    ]);

    return { data, total, page, limit, hasMore: skip + data.length < total };
  }

  /**
   * PATCH /admin/enrollments/:id/approve
   * Sets status to ACTIVE and emits enrollment.approved event.
   */
  async approveEnrollment(id: string): Promise<any> {
    const enrollment = await this.adminRepository.findEnrollmentById(id);
    if (!enrollment) throw new NotFoundException(`Enrollment #${id} not found`);
    if (enrollment.status === EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('Enrollment is already active');
    }

    const updated = await this.adminRepository.updateEnrollmentStatus(
      id,
      EnrollmentStatus.ACTIVE,
    );

    this.eventEmitter.emit('enrollment.approved', {
      enrollmentId: id,
      userId: enrollment.user?.id,
      courseId: enrollment.course?.id,
      courseTitle: enrollment.course?.title,
    });

    return updated;
  }

  /**
   * PATCH /admin/enrollments/:id/reject
   * Sets status to CANCELLED and emits enrollment.rejected event.
   */
  async rejectEnrollment(id: string): Promise<any> {
    const enrollment = await this.adminRepository.findEnrollmentById(id);
    if (!enrollment) throw new NotFoundException(`Enrollment #${id} not found`);
    if (enrollment.status === EnrollmentStatus.CANCELLED) {
      throw new BadRequestException('Enrollment is already cancelled');
    }

    const updated = await this.adminRepository.updateEnrollmentStatus(
      id,
      EnrollmentStatus.CANCELLED,
    );

    this.eventEmitter.emit('enrollment.rejected', {
      enrollmentId: id,
      userId: enrollment.user?.id,
      courseId: enrollment.course?.id,
      courseTitle: enrollment.course?.title,
    });

    return updated;
  }
}
