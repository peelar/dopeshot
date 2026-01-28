#!/usr/bin/env bash
set -euo pipefail

# Quick guard: skip if explicitly requested
if [[ "${DEV_SKIP_DB_CHECK:-}" == "1" ]]; then
  echo "Skipping DB status check (DEV_SKIP_DB_CHECK=1)."
  exit 0
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/apps/app"
cd "$APP_DIR"

ENV_FILES=()
if [[ -n "${DEV_DB_ENV_FILE:-}" ]]; then
  ENV_FILES+=("$DEV_DB_ENV_FILE")
fi
ENV_FILES+=(".env.local" ".env")

# Resolve DATABASE_URL / DIRECT_DATABASE_URL from env or local env files
ENV_FILE_DB_URL="$(grep -h '^DATABASE_URL=' "${ENV_FILES[@]}" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
ENV_FILE_DIRECT_URL="$(grep -h '^DIRECT_DATABASE_URL=' "${ENV_FILES[@]}" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
ENV_FILE_DIRECT_ALT_URL="$(grep -h '^DIRECT_URL=' "${ENV_FILES[@]}" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"

ACTIVE_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-${ENV_FILE_DIRECT_URL:-${ENV_FILE_DIRECT_ALT_URL:-$ENV_FILE_DB_URL}}}}"

# Strip surrounding quotes if present
strip_quotes() {
  local s="$1"
  s="${s%\"}"; s="${s#\"}"
  s="${s%\'}"; s="${s#\'}"
  echo "$s"
}

ACTIVE_URL="$(strip_quotes "$ACTIVE_URL")"

if [[ -z "$ACTIVE_URL" ]]; then
  cat <<'EOF'
No DATABASE_URL / DIRECT_DATABASE_URL found. Skipping DB status check.
Set one in apps/app/.env(.local) or export it, or set DEV_SKIP_DB_CHECK=1 to silence this message.
EOF
  exit 0
fi

AUTO_MIGRATE="${DEV_AUTO_MIGRATE:-1}"

echo "Checking database status (prisma migrate status)..."
if echo "$ACTIVE_URL" | grep -E ':6543(/|\\?|$)' >/dev/null; then
  echo "Warning: URL uses the transaction pooler (6543). Prisma migrate deploy requires a session/direct URL on port 5432."
fi
if echo "$ACTIVE_URL" | grep -q "pooler" && echo "$ACTIVE_URL" | grep -q ":5432"; then
  echo "Note: URL points to the Supabase session pooler on 5432; that's fine for Prisma CLI. Direct db.<ref>.supabase.co:5432 also works."
fi
OUTPUT="$(DATABASE_URL="$ACTIVE_URL" pnpm prisma migrate status 2>&1)" || status=$?

PENDING=0
if echo "$OUTPUT" | grep -q "have not yet been applied"; then
  PENDING=1
fi
if echo "$OUTPUT" | grep -q "Database schema is up to date"; then
  PENDING=0
fi

if [[ "$PENDING" -eq 0 && "${status:-0}" -eq 0 ]]; then
  echo "Database schema looks good."
  exit 0
fi

# If status failed (drift/network) and not just pending, bubble up
if [[ "${status:-0}" -ne 0 && "$PENDING" -eq 0 ]]; then
  echo "$OUTPUT"
  cat <<'EOF'

Prisma migrate status failed.

Common fixes:
- Ensure DIRECT_DATABASE_URL (or DATABASE_URL fallback) is set in apps/app/.env(.local) and is a valid Postgres URL.
- Use the direct Supabase URL (not pooled) for migrations/CLI.
- Make sure your database is reachable (local Postgres running or Supabase tunnel/VPN up).
- If you're working without the app DB (e.g., landing-only), rerun with DEV_SKIP_DB_CHECK=1.
EOF
  exit "${status:-1}"
fi

echo "$OUTPUT"
echo "Pending migrations detected."

if [[ "$AUTO_MIGRATE" == "1" ]]; then
  if echo "$ACTIVE_URL" | grep -E ':6543(/|\\?|$)' >/dev/null; then
    echo "Auto-migrate blocked: URL is the transaction pooler (6543). Use session/direct on 5432."
    exit 1
  fi
  echo "Applying pending migrations automatically (DEV_AUTO_MIGRATE=1)..."
  DATABASE_URL="$ACTIVE_URL" pnpm prisma migrate deploy
  exit $?
fi

cat <<'EOF'
Run migrations now so dev uses the latest schema:
  pnpm db:dev

Auto-apply is ON by default. To disable, set DEV_AUTO_MIGRATE=0.
EOF
exit 1
