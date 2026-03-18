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
import { LessonsService } from '../services/lessons.service';
import { CreateLessonDto } from '../dto/lesson/create-lesson.dto';
import { UpdateLessonDto } from '../dto/lesson/update-lesson.dto';

/**
 * LessonsController — manage lessons within a course module.
 *
 * POST   /courses/:courseId/modules/:moduleId/lessons      — add lesson (instructor/admin)
 * GET    /courses/:courseId/modules/:moduleId/lessons      — list lessons (active enrollees)
 * GET    /courses/:courseId/modules/:moduleId/lessons/:id  — lesson detail (active enrollees)
 * PATCH  /courses/:courseId/modules/:moduleId/lessons/:id  — update lesson (instructor/admin)
 * DELETE /courses/:courseId/modules/:moduleId/lessons/:id  — delete lesson (instructor/admin)
 *
 * The GET endpoints require an ACTIVE enrollment for students;
 * teachers and admins bypass this check.
 */
@Controller('courses/:courseId/modules/:moduleId/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  create(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
    @Req() req: any,
  ) {
    return this.lessonsService.create(moduleId, dto, req.user.sub, req.user.role);
  }

  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Req() req: any,
  ) {
    return this.lessonsService.findByModule(
      moduleId,
      courseId,
      req.user.sub,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.lessonsService.findById(id, courseId, req.user.sub, req.user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @Req() req: any,
  ) {
    return this.lessonsService.update(id, dto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.lessonsService.remove(id, req.user.sub, req.user.role);
  }
}
