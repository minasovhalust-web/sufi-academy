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
  Query,
  Req,
} from '@nestjs/common';
import { CoursesService } from '../services/courses.service';
import { CreateCourseDto } from '../dto/course/create-course.dto';
import { UpdateCourseDto } from '../dto/course/update-course.dto';
import { CourseStatus } from '@prisma/client';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * CoursesController — CRUD for courses.
 *
 * GET  /courses          — public catalog (no auth required)
 * GET  /courses/my       — instructor's own courses (auth required)
 * GET  /courses/:id      — public course detail (no auth required)
 * POST /courses          — create (TEACHER or ADMIN)
 * PATCH /courses/:id     — update (instructor or ADMIN)
 * DELETE /courses/:id    — delete (instructor or ADMIN)
 */
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() dto: CreateCourseDto, @Req() req: any) {
    return this.coursesService.create(dto, req.user.sub);
  }

  @Public()
  @Get()
  findAll(
    @Query('status') status?: CourseStatus,
    @Query('instructorId') instructorId?: string,
  ) {
    return this.coursesService.findAll({ status, instructorId });
  }

  // Must be declared BEFORE `:id` to prevent NestJS routing "my" as an id param
  @Get('my')
  findMy(@Req() req: any) {
    return this.coursesService.findMy(req.user.sub);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Req() req: any,
  ) {
    return this.coursesService.update(id, dto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.remove(id, req.user.sub, req.user.role);
  }
}
