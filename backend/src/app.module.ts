import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

// Feature modules
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { StorageModule } from './modules/storage/storage.module';
import { VideosModule } from './modules/videos/videos.module';
import { ChatModule } from './modules/chat/chat.module';
import { LiveModule } from './modules/live/live.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';

// Common
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * AppModule is the root module.
 *
 * Global providers:
 * - APP_GUARD JwtAuthGuard: protects all routes by default.
 *   Routes opt out via @Public() decorator.
 * - APP_GUARD RolesGuard: enforces @Roles() on protected routes.
 *   Runs after JwtAuthGuard so req.user is always populated.
 * - APP_INTERCEPTOR TransformInterceptor: wraps all responses.
 * - APP_INTERCEPTOR LoggingInterceptor: logs all requests.
 * - APP_FILTER HttpExceptionFilter: standardizes all error responses.
 *
 * EventEmitterModule is registered here for cross-module communication.
 * Feature modules emit/listen to events without importing each other.
 *
 * As new feature modules are built (CoursesModule, ChatModule, etc.),
 * they are added to the imports array here ONLY — no changes to existing modules.
 */
@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Event-driven cross-module communication
    EventEmitterModule.forRoot({
      // Wildcard allows listening to e.g. 'course.*' events
      wildcard: true,
      delimiter: '.',
      // Throw on unhandled promise rejections in listeners
      ignoreErrors: false,
    }),

    // Phase 1 feature modules
    UsersModule,
    AuthModule,

    // Phase 2 feature modules
    CoursesModule,

    // Phase 3 feature modules
    StorageModule,
    VideosModule,

    // Phase 4 feature modules
    ChatModule,

    // Phase 5 feature modules
    LiveModule,

    // Phase 6 feature modules
    NotificationsModule,
    AnalyticsModule,

    // Phase 7 feature modules
    AdminModule,

    // Future modules added here as implemented:
    // MaterialsModule,
  ],
  providers: [
    // Global JWT guard — all routes require auth unless @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global roles guard — runs after JWT guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global response transformer
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global request logger
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global exception handler
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Reflector must be provided for guards that use it
    Reflector,
  ],
})
export class AppModule {}
