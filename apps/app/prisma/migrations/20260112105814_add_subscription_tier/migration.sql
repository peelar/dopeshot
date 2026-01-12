-- AlterTable
ALTER TABLE "public"."user_metadata"
ADD COLUMN "subscription_tier" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "subscription_status" TEXT NOT NULL DEFAULT 'active';
