import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * POST /progress/lesson/:lessonId — mark lesson completed.
   * Teachers/admins can pass { userId, completed } in body to update a student's progress.
   */
  @Post('lesson/:lessonId')
  @HttpCode(HttpStatus.OK)
  completeLesson(
    @Param('lessonId') lessonId: string,
    @Body() body: { userId?: string; completed?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    const isTeacherOrAdmin = user.role === 'TEACHER' || user.role === 'ADMIN';

    // If a teacher/admin provides a target userId, delegate to the teacher method
    if (isTeacherOrAdmin && body?.userId && body.userId !== user.sub) {
      return this.progressService.setLessonProgressAsTeacher(
        user.sub,
        user.role,
        lessonId,
        body.userId,
        body.completed !== false, // default to true if not specified
      );
    }

    // Standard student flow (or teacher marking their own)
    if (body?.completed === false) {
      return this.progressService.uncompleteLesson(user.sub, lessonId);
    }
    return this.progressService.completeLesson(user.sub, lessonId);
  }

  /** DELETE /progress/lesson/:lessonId — unmark lesson */
  @Delete('lesson/:lessonId')
  @HttpCode(HttpStatus.OK)
  uncompleteLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.uncompleteLesson(user.sub, lessonId);
  }

  /** GET /progress/course/:courseId — current user's completed lesson IDs */
  @Get('course/:courseId')
  getCourseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getCourseProgress(user.sub, courseId);
  }

  /** GET /progress/course/:courseId/students — per-student progress (teacher/admin) */
  @Get('course/:courseId/students')
  getStudentProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getStudentProgress(courseId, user.sub, user.role);
  }
}
