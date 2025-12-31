-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."feature_flag_configs" (
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "default_value" BOOLEAN NOT NULL DEFAULT FALSE,
    "rollout_percentage" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_configs_pkey" PRIMARY KEY ("key")
);

-- Seed initial brand experience flag (disabled by default)
INSERT INTO "public"."feature_flag_configs" (
  "key",
  "description",
  "default_value",
  "rollout_percentage",
  "enabled"
) VALUES (
  'features.show-brand-experience',
  'Enable onboarding/brand UI that is still under active development.',
  FALSE,
  0,
  TRUE
) ON CONFLICT ("key") DO NOTHING;
