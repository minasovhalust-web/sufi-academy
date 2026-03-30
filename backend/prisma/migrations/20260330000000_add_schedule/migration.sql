-- Phase 10: Schedule system
-- Add optional fields to live_sessions
ALTER TABLE "live_sessions" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "live_sessions" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Create scheduled_lessons table
CREATE TABLE IF NOT EXISTS "scheduled_lessons" (
    "id"          TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "courseId"    TEXT         NOT NULL,
    "lessonId"    TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_lessons_pkey" PRIMARY KEY ("id")
);

-- FK: scheduled_lessons → courses (cascade delete)
ALTER TABLE "scheduled_lessons"
    ADD CONSTRAINT "scheduled_lessons_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for efficient calendar queries
CREATE INDEX IF NOT EXISTS "scheduled_lessons_courseId_scheduledAt_idx"
    ON "scheduled_lessons"("courseId", "scheduledAt");
