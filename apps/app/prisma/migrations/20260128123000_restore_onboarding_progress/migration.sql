-- Restore onboarding progress tracking after it was dropped in 20260112135028.
-- Keeps IF NOT EXISTS to be safe on environments that never lost the column.
ALTER TABLE "public"."user_metadata"
ADD COLUMN IF NOT EXISTS "onboarding_progress" JSONB;
