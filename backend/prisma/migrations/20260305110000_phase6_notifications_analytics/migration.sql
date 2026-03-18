-- CreateEnum: NotificationType
CREATE TYPE "NotificationType" AS ENUM (
  'COURSE_CREATED',
  'STUDENT_ENROLLED',
  'LIVE_SESSION_STARTED',
  'LIVE_SESSION_ENDED',
  'TEACHER_ASSIGNED'
);

-- CreateEnum: ActivityEventType
CREATE TYPE "ActivityEventType" AS ENUM (
  'COURSE_CREATED',
  'STUDENT_ENROLLED',
  'VIDEO_UPLOADED',
  'CHAT_MESSAGE_SENT',
  'LIVE_SESSION_STARTED',
  'LIVE_SESSION_ENDED'
);

-- CreateTable: notifications
CREATE TABLE "notifications" (
  "id"        TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "readAt"    TIMESTAMP(3),
  "metadata"  JSONB,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_logs
CREATE TABLE "activity_logs" (
  "id"          TEXT NOT NULL,
  "event"       "ActivityEventType" NOT NULL,
  "actorId"     TEXT,
  "subjectId"   TEXT,
  "subjectType" TEXT,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
CREATE INDEX "activity_logs_event_createdAt_idx" ON "activity_logs"("event", "createdAt");
CREATE INDEX "activity_logs_actorId_createdAt_idx" ON "activity_logs"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
