-- Extend personal backgrounds with source metadata
ALTER TABLE "personal_backgrounds"
  ADD COLUMN IF NOT EXISTS "source_type" TEXT NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS "source_id" TEXT;

-- Create AI background catalog table
CREATE TABLE IF NOT EXISTS "ai_backgrounds" (
  "id" TEXT NOT NULL,
  "personality" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "prompt" TEXT,
  "seed" INTEGER,
  "storage_path" TEXT NOT NULL,
  "preview_url" TEXT NOT NULL,
  "file_size_kb" INTEGER NOT NULL,
  "width_px" INTEGER NOT NULL,
  "height_px" INTEGER NOT NULL,
  "file_format" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ai_backgrounds_pkey" PRIMARY KEY ("id")
);

-- Index for fast catalog queries
CREATE INDEX IF NOT EXISTS "ai_backgrounds_personality_status_idx" ON "ai_backgrounds"("personality", "status");

-- Ensure background selections can reference catalog by type
-- (No schema change required; background_type is TEXT)
