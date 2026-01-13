-- AlterTable
ALTER TABLE "public"."user_metadata"
ADD COLUMN IF NOT EXISTS "onboarding_progress" JSONB;
