import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { CoursesRepository } from '../repositories/courses.repository';
import { CreateCourseDto } from '../dto/course/create-course.dto';
import { UpdateCourseDto } from '../dto/course/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateCourseDto, instructorId: string): Promise<any> {
    const existing = await this.coursesRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(
        `Course with slug "${dto.slug}" already exists`,
      );
    }
    const course = await this.coursesRepository.create({
      ...dto,
      instructorId: instructorId,
    });
    this.eventEmitter.emit('course.created', {
      courseId: course.id,
      instructorId,
      title: course.title,
      slug: course.slug,
    });
    return course;
  }

  async findAll(filters?: {
    status?: any;
    instructorId?: string;
  }): Promise<any[]> {
    return this.coursesRepository.findAll(filters);
  }

  async findMy(instructorId: string): Promise<any[]> {
    return this.coursesRepository.findAll({ instructorId });
  }

  async findById(id: string): Promise<any> {
    const course = await this.coursesRepository.findById(id);
    if (!course) throw new NotFoundException(`Course #${id} not found`);
    return course;
  }

  async update(
    id: string,
    dto: UpdateCourseDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<any> {
    const course = await this.findById(id);
    if (
      course.instructorId !== requesterId &&
      requesterRole !== Role.ADMIN
    ) {
      throw new ForbiddenException('Only the course instructor can edit this course');
    }
    if (dto.slug && dto.slug !== course.slug) {
      const existing = await this.coursesRepository.findBySlug(dto.slug);
      if (existing) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
    }
    return this.coursesRepository.update(id, dto);
  }

  async remove(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const course = await this.findById(id);
    if (
      course.instructorId !== requesterId &&
      requesterRole !== Role.ADMIN
    ) {
      throw new ForbiddenException('Only the course instructor can delete this course');
    }
    await this.coursesRepository.delete(id);
  }
}
