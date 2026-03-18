import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';
import { CreateEnrollmentDto } from '../dto/enrollment/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/enrollment/update-enrollment.dto';

/**
 * EnrollmentsController — student enrollment management.
 *
 * POST   /enrollments                       — enroll in a course
 * GET    /enrollments/my                    — my enrollments
 * GET    /enrollments/course/:courseId      — course roster (instructor/admin only)
 * PATCH  /enrollments/course/:courseId      — update my progress/status
 * DELETE /enrollments/course/:courseId      — unenroll
 */
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  enroll(@Body() dto: CreateEnrollmentDto, @Req() req: any) {
    return this.enrollmentsService.enroll(dto, req.user.sub);
  }

  @Get('my')
  findMy(@Req() req: any) {
    return this.enrollmentsService.findMyEnrollments(req.user.sub);
  }

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string, @Req() req: any) {
    return this.enrollmentsService.findByCourse(
      courseId,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch('course/:courseId')
  updateProgress(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateEnrollmentDto,
    @Req() req: any,
  ) {
    return this.enrollmentsService.updateProgress(
      courseId,
      req.user.sub,
      dto,
    );
  }

  @Delete('course/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unenroll(@Param('courseId') courseId: string, @Req() req: any) {
    return this.enrollmentsService.unenroll(courseId, req.user.sub);
  }
}
