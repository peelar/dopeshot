-- AlterTable
ALTER TABLE "public"."user_metadata"
ADD COLUMN IF NOT EXISTS "subscription_cancel_at_period_end" BOOLEAN,
ADD COLUMN IF NOT EXISTS "subscription_current_period_end" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscription_ends_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "polar_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS "polar_subscription_id" TEXT;
