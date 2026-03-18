import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CourseModulesRepository } from '../repositories/course-modules.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import { CreateCourseModuleDto } from '../dto/module/create-course-module.dto';
import { UpdateCourseModuleDto } from '../dto/module/update-course-module.dto';

@Injectable()
export class CourseModulesService {
  constructor(
    private readonly modulesRepository: CourseModulesRepository,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  private async assertInstructor(
    courseId: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) throw new NotFoundException(`Course #${courseId} not found`);
    if (course.instructorId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the course instructor can manage modules',
      );
    }
  }

  async create(
    courseId: string,
    dto: CreateCourseModuleDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    await this.assertInstructor(courseId, requesterId, requesterRole);
    return this.modulesRepository.create({
      ...dto,
      course: { connect: { id: courseId } },
    });
  }

  async findByCourse(courseId: string): Promise<any[]> {
    return this.modulesRepository.findByCourse(courseId);
  }

  async findById(id: string): Promise<any> {
    const module = await this.modulesRepository.findById(id);
    if (!module) throw new NotFoundException(`Module #${id} not found`);
    return module;
  }

  async update(
    id: string,
    dto: UpdateCourseModuleDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    const module = await this.findById(id);
    await this.assertInstructor(
      module.courseId,
      requesterId,
      requesterRole,
    );
    return this.modulesRepository.update(id, dto);
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const module = await this.findById(id);
    await this.assertInstructor(
      module.courseId,
      requesterId,
      requesterRole,
    );
    await this.modulesRepository.delete(id);
  }
}
