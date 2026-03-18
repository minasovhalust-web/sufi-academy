import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { GetUsersDto } from '../dto/get-users.dto';
import { GetCoursesDto } from '../dto/get-courses.dto';
import { GetEnrollmentsDto } from '../dto/get-enrollments.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UpdateCourseStatusDto } from '../dto/update-course-status.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';

/**
 * AdminController — platform administration endpoints.
 *
 * All routes require Role.ADMIN (class-level @Roles + global RolesGuard).
 *
 * Dashboard:
 *   GET  /admin/dashboard
 *
 * Users:
 *   GET   /admin/users
 *   GET   /admin/users/:id
 *   PATCH /admin/users/:id/role
 *   PATCH /admin/users/:id/status
 *
 * Courses:
 *   GET    /admin/courses
 *   PATCH  /admin/courses/:id/status
 *   DELETE /admin/courses/:id
 *
 * Enrollments:
 *   GET   /admin/enrollments          — list (filterable by status, e.g. PENDING)
 *   PATCH /admin/enrollments/:id/approve — approve → ACTIVE
 *   PATCH /admin/enrollments/:id/reject  — reject  → CANCELLED
 */
@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ────────────────────────────────────────────────────────────────

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  @Get('users')
  async getUsers(@Query() query: GetUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.adminService.updateUserRole(id, dto, requesterId);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.adminService.updateUserStatus(id, dto, requesterId);
  }

  // ── Courses ──────────────────────────────────────────────────────────────────

  @Get('courses')
  async getCourses(@Query() query: GetCoursesDto) {
    return this.adminService.getCourses(query);
  }

  @Patch('courses/:id/status')
  async updateCourseStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseStatusDto,
  ) {
    return this.adminService.updateCourseStatus(id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deleteCourse(id);
  }

  // ── Enrollments ──────────────────────────────────────────────────────────────

  /**
   * GET /admin/enrollments
   * Query params: status (PENDING | ACTIVE | COMPLETED | CANCELLED), page, limit
   * Default shows all; pass ?status=PENDING to see the approval queue.
   */
  @Get('enrollments')
  async getEnrollments(@Query() query: GetEnrollmentsDto) {
    return this.adminService.getEnrollments(query);
  }

  /**
   * PATCH /admin/enrollments/:id/approve
   * Transitions the enrollment from PENDING → ACTIVE.
   * Student gains full access to course materials.
   */
  @Patch('enrollments/:id/approve')
  async approveEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveEnrollment(id);
  }

  /**
   * PATCH /admin/enrollments/:id/reject
   * Transitions the enrollment from PENDING → CANCELLED.
   */
  @Patch('enrollments/:id/reject')
  async rejectEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectEnrollment(id);
  }
}
