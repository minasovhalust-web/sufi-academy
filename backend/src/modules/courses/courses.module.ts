import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

// Controllers
import { CoursesController } from './controllers/courses.controller';
import { CourseModulesController } from './controllers/course-modules.controller';
import { LessonsController } from './controllers/lessons.controller';
import { MaterialsController } from './controllers/materials.controller';
import { EnrollmentsController } from './controllers/enrollments.controller';

// Services
import { CoursesService } from './services/courses.service';
import { CourseModulesService } from './services/course-modules.service';
import { LessonsService } from './services/lessons.service';
import { MaterialsService } from './services/materials.service';
import { EnrollmentsService } from './services/enrollments.service';

// Repositories
import { CoursesRepository } from './repositories/courses.repository';
import { CourseModulesRepository } from './repositories/course-modules.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { MaterialsRepository } from './repositories/materials.repository';
import { EnrollmentsRepository } from './repositories/enrollments.repository';

/**
 * CoursesModule — Phase 2.
 *
 * Encapsulates the full learning content hierarchy:
 *   Course → CourseModule (chapter) → Lesson → Material
 * Plus student enrollment tracking via Enrollment.
 *
 * Imports:
 * - PrismaModule: required for all repositories (not global).
 *
 * All five feature controllers are registered here.
 * Repositories are internal implementation details — not exported.
 * CoursesService is exported for potential cross-module use (e.g. AnalyticsModule).
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    CoursesController,
    CourseModulesController,
    LessonsController,
    MaterialsController,
    EnrollmentsController,
  ],
  providers: [
    // Services
    CoursesService,
    CourseModulesService,
    LessonsService,
    MaterialsService,
    EnrollmentsService,
    // Repositories
    CoursesRepository,
    CourseModulesRepository,
    LessonsRepository,
    MaterialsRepository,
    EnrollmentsRepository,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
