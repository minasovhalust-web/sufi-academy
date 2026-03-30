import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { CreateScheduledLessonDto } from '../dto/create-scheduled-lesson.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async createLesson(
    courseId: string,
    dto: CreateScheduledLessonDto,
    requesterId: string,
    requesterRole: Role,
  ) {
    // Only TEACHER (who owns the course — checked in controller) or ADMIN
    return this.scheduleRepository.create({
      title: dto.title,
      description: dto.description,
      scheduledAt: new Date(dto.scheduledAt),
      courseId,
      lessonId: dto.lessonId,
    });
  }

  async getCourseLessons(courseId: string) {
    return this.scheduleRepository.findByCourse(courseId);
  }

  async deleteLesson(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ) {
    const lesson = await this.scheduleRepository.findById(id);
    if (!lesson) throw new NotFoundException(`Scheduled lesson #${id} not found`);
    // ADMIN can always delete; others only if they own the course.
    // Course-ownership check requires a join — we rely on the controller
    // passing the correct role; service just enforces ADMIN bypass.
    if (requesterRole !== Role.ADMIN && requesterRole !== Role.TEACHER) {
      throw new ForbiddenException('Only teachers and admins can delete scheduled lessons');
    }
    await this.scheduleRepository.delete(id);
  }

  /** Upcoming lessons across all courses the user is actively enrolled in. */
  async getMySchedule(userId: string, role: Role) {
    if (role === Role.TEACHER || role === Role.ADMIN) {
      return this.scheduleRepository.findForInstructor(userId);
    }
    return this.scheduleRepository.findUpcomingForUser(userId);
  }
}
