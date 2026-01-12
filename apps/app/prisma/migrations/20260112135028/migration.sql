/*
  Warnings:

  - You are about to drop the column `onboarding_progress` on the `user_metadata` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_metadata" DROP COLUMN "onboarding_progress";
