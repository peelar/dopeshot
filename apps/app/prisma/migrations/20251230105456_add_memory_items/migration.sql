-- DropForeignKey
ALTER TABLE "background_selections" DROP CONSTRAINT "background_selections_user_id_fkey";

-- DropForeignKey
ALTER TABLE "personal_backgrounds" DROP CONSTRAINT "personal_backgrounds_user_id_fkey";

-- AlterTable
ALTER TABLE "background_selections" ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "memory_items" ALTER COLUMN "shared_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "personal_backgrounds" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "personal_backgrounds" ADD CONSTRAINT "personal_backgrounds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_selections" ADD CONSTRAINT "background_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
