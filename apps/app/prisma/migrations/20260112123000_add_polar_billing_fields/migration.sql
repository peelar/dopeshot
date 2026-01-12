-- AlterTable
ALTER TABLE "public"."user_metadata"
ADD COLUMN "subscription_tier" TEXT,
ADD COLUMN "subscription_status" TEXT,
ADD COLUMN "subscription_cancel_at_period_end" BOOLEAN,
ADD COLUMN "subscription_current_period_end" TIMESTAMP(3),
ADD COLUMN "subscription_ends_at" TIMESTAMP(3),
ADD COLUMN "polar_customer_id" TEXT,
ADD COLUMN "polar_subscription_id" TEXT;
