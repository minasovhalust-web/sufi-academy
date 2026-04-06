import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

/**
 * Bootstrap function initialises the NestJS application.
 *
 * Security and configuration decisions made here:
 *
 * 1. Global ValidationPipe:
 *    - whitelist: strips any properties not in DTOs (prevents mass assignment attacks)
 *    - forbidNonWhitelisted: throws 400 if unknown properties are sent
 *    - transform: automatically transforms plain objects to DTO class instances
 *
 * 2. ClassSerializerInterceptor (global):
 *    Processes @Exclude() and @Expose() decorators on response DTOs.
 *    This ensures UserResponseDto correctly strips the password field.
 *
 * 3. CORS:
 *    Configured to allow only the frontend origin.
 *    Credentials must be allowed for cookies (if used in future).
 *
 * 4. Global prefix:
 *    All routes are prefixed with /api/v1 for versioning.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Suppress framework-level logs in production, handle them via LoggingInterceptor
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['log', 'debug', 'error', 'verbose', 'warn'],
  });

  // Global API prefix — all routes: /api/v1/...
  app.setGlobalPrefix('api/v1');

  // Validation pipe — applied to all route handlers
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Serializer interceptor — processes @Exclude/@Expose on response DTOs
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS — restrict to frontend origin in production
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve local uploads as static files at /uploads/<filename>
  // Used by LocalProvider (dev mode without S3). Safe to enable in all envs —
  // the directory is empty when S3 is active.
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // Graceful shutdown hooks — ensures Prisma closes the connection pool cleanly
  app.enableShutdownHooks();

  const port = process.env.APP_PORT ?? 4000;
  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}/api/v1`);
}

bootstrap();
