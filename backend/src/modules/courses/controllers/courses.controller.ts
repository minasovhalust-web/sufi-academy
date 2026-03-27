import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from '../services/courses.service';
import { CreateCourseDto } from '../dto/course/create-course.dto';
import { UpdateCourseDto } from '../dto/course/update-course.dto';
import { CourseStatus } from '@prisma/client';
import { Public } from '../../../common/decorators/public.decorator';
import { STORAGE_SERVICE, StorageService } from '../../storage/storage.interface';
import { randomUUID } from 'crypto';
import { extname } from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

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
  constructor(
    private readonly coursesService: CoursesService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

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

  /**
   * POST /courses/:id/image
   * Upload (or replace) the cover image for a course.
   * Returns { imageUrl } — the public URL stored on the course record.
   */
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const ext = extname(file.originalname).toLowerCase();
    const key = `course-covers/${randomUUID()}${ext}`;

    await this.storageService.upload(file.buffer, key, file.mimetype);
    const imageUrl = await this.storageService.getSignedUrl(
      key,
      60 * 60 * 24 * 365,
    );

    await this.coursesService.updateImageUrl(
      id,
      imageUrl,
      req.user.sub,
      req.user.role,
    );

    return { imageUrl };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.remove(id, req.user.sub, req.user.role);
  }
}
