-- Add PENDING value to EnrollmentStatus enum
-- PostgreSQL allows adding enum values without recreating the type
ALTER TYPE "EnrollmentStatus" ADD VALUE 'PENDING' BEFORE 'ACTIVE';

-- Change the default status for new enrollments to PENDING
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
