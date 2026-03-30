import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ScheduleService } from '../services/schedule.service';
import { CreateScheduledLessonDto } from '../dto/create-scheduled-lesson.dto';

/**
 * ScheduleController
 *
 * POST   /courses/:courseId/schedule  — add a lesson to a course schedule
 * GET    /courses/:courseId/schedule  — list all lessons for a course
 * DELETE /schedule/:id               — remove a scheduled lesson
 * GET    /schedule/my                — upcoming lessons for the current user
 */
@Controller()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /** Add a scheduled lesson to a course (teacher / admin). */
  @Post('courses/:courseId/schedule')
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateScheduledLessonDto,
    @Req() req: any,
  ) {
    return this.scheduleService.createLesson(courseId, dto, req.user.sub, req.user.role);
  }

  /** List all scheduled lessons for a course. */
  @Get('courses/:courseId/schedule')
  findByCourse(@Param('courseId') courseId: string) {
    return this.scheduleService.getCourseLessons(courseId);
  }

  /**
   * Upcoming lessons for the current user.
   * Must be declared BEFORE :id to avoid "my" being treated as an id param.
   */
  @Get('schedule/my')
  findMy(@Req() req: any) {
    return this.scheduleService.getMySchedule(req.user.sub, req.user.role);
  }

  /** Delete a scheduled lesson. */
  @Delete('schedule/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.scheduleService.deleteLesson(id, req.user.sub, req.user.role);
  }
}
