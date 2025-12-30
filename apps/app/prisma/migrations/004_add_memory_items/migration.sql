-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."memory_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "config_hash" VARCHAR(32) NOT NULL,
    "screenshot_path" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "share_hash" VARCHAR(12),
    "shared_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "memory_items_user_id_idx" ON "public"."memory_items"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "memory_items_user_id_created_at_idx" ON "public"."memory_items"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "memory_items_user_id_config_hash_idx" ON "public"."memory_items"("user_id", "config_hash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "memory_items_share_hash_key" ON "public"."memory_items"("share_hash");

-- AddForeignKey
ALTER TABLE "public"."memory_items" ADD CONSTRAINT "memory_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
