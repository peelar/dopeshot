-- CreateTable
CREATE TABLE IF NOT EXISTS "personal_backgrounds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "storage_path" TEXT NOT NULL,
    "preview_url" TEXT NOT NULL,
    "file_size_kb" INTEGER NOT NULL,
    "width_px" INTEGER NOT NULL,
    "height_px" INTEGER NOT NULL,
    "file_format" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "personal_backgrounds_user_id_idx" ON "personal_backgrounds"("user_id");

-- AddForeignKey (guarded for existing schema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'personal_backgrounds_user_id_fkey'
          AND conrelid = 'public.personal_backgrounds'::regclass
    ) THEN
        ALTER TABLE "personal_backgrounds"
          ADD CONSTRAINT "personal_backgrounds_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "background_selections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "background_type" TEXT NOT NULL,
    "background_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "background_selections_user_id_key" ON "background_selections"("user_id");

-- AddForeignKey (guarded for existing schema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'background_selections_user_id_fkey'
          AND conrelid = 'public.background_selections'::regclass
    ) THEN
        ALTER TABLE "background_selections"
          ADD CONSTRAINT "background_selections_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
