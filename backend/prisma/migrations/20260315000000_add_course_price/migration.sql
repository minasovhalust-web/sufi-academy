-- Add price and currency fields to courses table
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'RUB';
