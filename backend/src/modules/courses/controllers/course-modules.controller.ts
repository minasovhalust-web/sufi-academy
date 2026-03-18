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
import { CourseModulesService } from '../services/course-modules.service';
import { CreateCourseModuleDto } from '../dto/module/create-course-module.dto';
import { UpdateCourseModuleDto } from '../dto/module/update-course-module.dto';

/**
 * CourseModulesController — manage modules (chapters) within a course.
 *
 * POST   /courses/:courseId/modules         — add module
 * GET    /courses/:courseId/modules         — list course modules
 * GET    /courses/:courseId/modules/:id     — module detail
 * PATCH  /courses/:courseId/modules/:id     — update module
 * DELETE /courses/:courseId/modules/:id     — delete module (cascades lessons)
 */
@Controller('courses/:courseId/modules')
export class CourseModulesController {
  constructor(private readonly modulesService: CourseModulesService) {}

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateCourseModuleDto,
    @Req() req: any,
  ) {
    return this.modulesService.create(courseId, dto, req.user.sub, req.user.role);
  }

  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseModuleDto,
    @Req() req: any,
  ) {
    return this.modulesService.update(id, dto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.modulesService.remove(id, req.user.sub, req.user.role);
  }
}
