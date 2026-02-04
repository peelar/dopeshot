-- Promote a user to admin by email or user_id.
-- Run with:
--   ./scripts/sql/run.sh <env> promote-admin-user.sql --email user@example.com
--   ./scripts/sql/run.sh <env> promote-admin-user.sql --var user_id=<uuid>

\if :{?user_id}
\else
\set user_id ''
\endif
\if :{?email}
\else
\set email ''
\endif

WITH resolved_user AS (
  SELECT
    COALESCE(
      NULLIF(:'user_id', ''),
      (SELECT id FROM "public"."user" WHERE lower(email) = lower(:'email') LIMIT 1)
    ) AS user_id
)
INSERT INTO "public"."user_metadata" (id, user_id, is_admin, created_at, updated_at)
SELECT
  md5(random()::text || clock_timestamp()::text),
  user_id,
  true,
  now(),
  now()
FROM resolved_user
WHERE user_id IS NOT NULL
ON CONFLICT (user_id)
DO UPDATE SET
  is_admin = true,
  updated_at = now()
RETURNING user_id, is_admin, updated_at;
