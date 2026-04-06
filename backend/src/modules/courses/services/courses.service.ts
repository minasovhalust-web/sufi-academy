import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { CoursesRepository } from '../repositories/courses.repository';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CreateCourseDto } from '../dto/course/create-course.dto';
import { UpdateCourseDto } from '../dto/course/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
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

    // Automatically enroll the instructor as an ACTIVE participant of their own course
    try {
      await this.enrollmentsRepository.create({
        status: 'ACTIVE',
        user: { connect: { id: instructorId } },
        course: { connect: { id: course.id } },
      });
    } catch {
      // Ignore if enrollment already exists (e.g. unique constraint violation)
    }

    this.eventEmitter.emit('course.created', {
      courseId: course.id,
      instructorId,
      title: course.title,
      slug: course.slug,
    });
    return course;
  }

  async findAll(
    filters?: { status?: any; instructorId?: string },
    role?: string,
  ): Promise<any[]> {
    // Non-privileged users (students, guests) may only see published courses.
    const isPrivileged = role === Role.ADMIN || role === Role.TEACHER;
    const effectiveFilters = {
      ...filters,
      // Force PUBLISHED unless an admin/teacher is requesting AND no explicit
      // status filter is already applied.
      status: isPrivileged && filters?.status ? filters.status : 'PUBLISHED',
    };
    // Admins/teachers browsing without a status filter should see everything.
    if (isPrivileged && !filters?.status) {
      delete effectiveFilters.status;
    }
    return this.coursesRepository.findAll(effectiveFilters);
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

  async updateImageUrl(
    id: string,
    imageUrl: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<void> {
    const course = await this.findById(id);
    if (
      course.instructorId !== requesterId &&
      requesterRole !== Role.ADMIN
    ) {
      throw new ForbiddenException('Only the course instructor can update this course image');
    }
    await this.coursesRepository.updateImageUrl(id, imageUrl);
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
