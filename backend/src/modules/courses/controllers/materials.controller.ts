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
import { MaterialsService } from '../services/materials.service';
import { CreateMaterialDto } from '../dto/material/create-material.dto';

/**
 * MaterialsController — manage materials (files, links, videos) attached to lessons.
 *
 * POST   /lessons/:lessonId/materials      — add material (instructor/admin)
 * GET    /lessons/:lessonId/materials      — list materials (active enrollees)
 * GET    /lessons/:lessonId/materials/:id  — material detail (active enrollees)
 * DELETE /lessons/:lessonId/materials/:id  — delete material (instructor/admin)
 */
@Controller('lessons/:lessonId/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateMaterialDto,
    @Req() req: any,
  ) {
    return this.materialsService.create(
      lessonId,
      dto,
      req.user.sub,
      req.user.role,
    );
  }

  @Get()
  findAll(@Param('lessonId') lessonId: string, @Req() req: any) {
    return this.materialsService.findByLesson(lessonId, req.user.sub, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.materialsService.findById(id, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.materialsService.remove(id, req.user.sub, req.user.role);
  }
}
