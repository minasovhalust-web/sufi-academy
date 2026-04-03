-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationCodeExpiresAt" TIMESTAMP(3);
