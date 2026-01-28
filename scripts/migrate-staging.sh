#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/apps/app"

ENV_FILE="${STAGING_ENV_FILE:-${ENV_FILE:-$APP_DIR/.env.local}}"

strip_quotes() {
  local s="$1"
  s="${s%\"}"; s="${s#\"}"
  s="${s%\'}"; s="${s#\'}"
  echo "$s"
}

read_env_value() {
  local key="$1"
  local file="$2"
  if [[ -f "$file" ]]; then
    grep -h "^${key}=" "$file" 2>/dev/null | tail -n1 | cut -d= -f2- || true
  fi
}

DIRECT_FROM_FILE="$(read_env_value "DIRECT_DATABASE_URL" "$ENV_FILE")"
DIRECT_ALT_FROM_FILE="$(read_env_value "DIRECT_URL" "$ENV_FILE")"

MIGRATION_URL="${DIRECT_DATABASE_URL:-${DIRECT_URL:-${DIRECT_FROM_FILE:-$DIRECT_ALT_FROM_FILE}}}"
MIGRATION_URL="$(strip_quotes "${MIGRATION_URL:-}")"

if [[ -z "$MIGRATION_URL" ]]; then
  cat <<EOF
No DIRECT_DATABASE_URL found.
- Add your staging direct/session URL to $ENV_FILE as DIRECT_DATABASE_URL=postgresql://...
- Or export DIRECT_DATABASE_URL in your shell and re-run.
EOF
  exit 1
fi

if echo "$MIGRATION_URL" | grep -E ':6543(/|\\?|$)' >/dev/null; then
  cat <<'EOF'
Refusing to run migrations against the transaction pooler (port 6543). Use the session/direct URL on port 5432 (db.<project-ref>.supabase.co or pooler on 5432).
EOF
  exit 1
fi

if echo "$MIGRATION_URL" | grep -qi "pooler" && echo "$MIGRATION_URL" | grep -q ':5432'; then
  echo "Note: URL points to the Supabase session pooler on 5432. That's OK for Prisma Migrate, but direct db.<ref>.supabase.co:5432 also works."
fi

echo "Using $ENV_FILE for staging env (override with STAGING_ENV_FILE=/path/to/.env)."
echo "Checking Prisma migrations against staging..."

cd "$APP_DIR"
STATUS_OUTPUT="$(DATABASE_URL="$MIGRATION_URL" pnpm prisma migrate status 2>&1)" || status=$?
echo "$STATUS_OUTPUT"

PENDING=0
if echo "$STATUS_OUTPUT" | grep -q "have not yet been applied"; then
  PENDING=1
fi
if echo "$STATUS_OUTPUT" | grep -q "Database schema is up to date"; then
  PENDING=0
fi

# If status errored for reasons other than pending migrations, abort
if [[ "${status:-0}" -ne 0 && "$PENDING" -eq 0 ]]; then
  echo "prisma migrate status failed (drift or connectivity). Fix before applying migrations."
  exit "${status:-1}"
fi

if [[ "$PENDING" -eq 0 ]]; then
  echo "No pending migrations for staging."
  exit 0
fi

if [[ "${AUTO_APPLY:-1}" == "1" && "${NO_APPLY:-0}" != "1" ]]; then
  echo "Applying pending migrations to staging (AUTO_APPLY=1)..."
  DATABASE_URL="$MIGRATION_URL" pnpm prisma migrate deploy
  echo "Migrations applied to staging."
else
  echo "Pending migrations detected. Re-run with AUTO_APPLY=1 to apply them."
  exit 2
fi
