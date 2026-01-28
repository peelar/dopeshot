#!/usr/bin/env bash
set -euo pipefail

# Generic migration script for staging/prod environments
# Usage: ./scripts/migrate.sh <environment> [--dry-run]
#   environment: staging or prod
#   --dry-run: only check status, don't apply migrations

ENVIRONMENT="${1:-}"
DRY_RUN=0

if [[ "$#" -ge 2 && "$2" == "--dry-run" ]]; then
  DRY_RUN=1
fi

if [[ -z "$ENVIRONMENT" ]]; then
  cat <<EOF
Usage: $0 <environment> [--dry-run]
  environment: staging or prod
  --dry-run: check migration status only, don't apply

Examples:
  $0 staging           # Apply migrations to staging
  $0 staging --dry-run # Check staging status
  $0 prod --dry-run    # Check prod status (safe first step)
  $0 prod              # Apply migrations to prod
EOF
  exit 1
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: environment must be 'staging' or 'prod'"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/apps/app"

# Helper functions
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

# Environment-specific configuration
if [[ "$ENVIRONMENT" == "staging" ]]; then
  ENV_FILE="${STAGING_ENV_FILE:-${ENV_FILE:-$APP_DIR/.env.local}}"
  ENV_VAR_PREFIX="STAGING"
else
  # For prod, prefer explicit env vars, fall back to .env.prod if it exists
  ENV_FILE="${PROD_ENV_FILE:-$APP_DIR/.env.prod}"
  ENV_VAR_PREFIX="PROD"
fi

# Try to get DIRECT_DATABASE_URL from multiple sources
# Priority: explicit env var > env file > generic DIRECT_DATABASE_URL
DIRECT_FROM_FILE="$(read_env_value "DIRECT_DATABASE_URL" "$ENV_FILE")"
DIRECT_ALT_FROM_FILE="$(read_env_value "DIRECT_URL" "$ENV_FILE")"

if [[ "$ENVIRONMENT" == "staging" ]]; then
  MIGRATION_URL="${STAGING_DIRECT_DATABASE_URL:-${DIRECT_DATABASE_URL:-${DIRECT_URL:-${DIRECT_FROM_FILE:-$DIRECT_ALT_FROM_FILE}}}}"
else
  MIGRATION_URL="${PROD_DIRECT_DATABASE_URL:-${DIRECT_DATABASE_URL:-${DIRECT_URL:-${DIRECT_FROM_FILE:-$DIRECT_ALT_FROM_FILE}}}}"
fi

MIGRATION_URL="$(strip_quotes "${MIGRATION_URL:-}")"

if [[ -z "$MIGRATION_URL" ]]; then
  cat <<EOF
No DIRECT_DATABASE_URL found for $ENVIRONMENT.

For staging:
  - Add DIRECT_DATABASE_URL to $ENV_FILE
  - Or export STAGING_DIRECT_DATABASE_URL in your shell

For prod:
  - Export PROD_DIRECT_DATABASE_URL in your shell
  - Or add DIRECT_DATABASE_URL to $ENV_FILE (not recommended for prod secrets)
  - Or pass DIRECT_DATABASE_URL directly

Example:
  PROD_DIRECT_DATABASE_URL='postgresql://...' $0 prod --dry-run
EOF
  exit 1
fi

# Safety check: refuse transaction pooler (port 6543)
if echo "$MIGRATION_URL" | grep -E ':6543(/|\\?|$)' >/dev/null; then
  cat <<'EOF'
Error: Refusing to run migrations against the transaction pooler (port 6543).

The transaction pooler does not support prepared statements, which Prisma migrations require.
Use one of these instead:
  - Direct connection (preferred): postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
  - Session pooler (IPv4 compatible): postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

Both use port 5432 and support migrations.
EOF
  exit 1
fi

# Informational: note which connection type is being used
if echo "$MIGRATION_URL" | grep -q "\.pooler\.supabase\.com:5432"; then
  echo "Note: Using Supabase session pooler (port 5432). IPv4-compatible, supports prepared statements."
elif echo "$MIGRATION_URL" | grep -q "db\.[^.]*\.supabase\.co:5432"; then
  echo "Note: Using Supabase direct connection (port 5432). IPv6 by default, optimal for migrations."
fi

# Prod safety check: require explicit confirmation unless dry-run
if [[ "$ENVIRONMENT" == "prod" && "$DRY_RUN" -eq 0 ]]; then
  if [[ "${PROD_MIGRATE_CONFIRMED:-}" != "yes" ]]; then
    cat <<'EOF'

WARNING: You are about to apply migrations to PRODUCTION.

This will modify the production database schema and cannot be easily undone.
Best practices:
  1. Run with --dry-run first to check status
  2. Ensure migrations have been tested on staging
  3. Have a rollback plan ready

To proceed, run:
  PROD_MIGRATE_CONFIRMED=yes $0 prod

Or use the package.json script which sets this automatically.
EOF
    exit 1
  fi
fi

echo "=========================================="
echo "Environment: $ENVIRONMENT"
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Mode: DRY RUN (status check only)"
else
  echo "Mode: APPLY MIGRATIONS"
fi
echo "Using: $ENV_FILE"
echo "=========================================="
echo ""

cd "$APP_DIR"

# Check migration status
echo "Checking Prisma migrations..."
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
  echo ""
  echo "Error: Migration status check failed (possible drift or connectivity issue)."
  echo "Fix the issue before applying migrations."
  exit "${status:-1}"
fi

if [[ "$PENDING" -eq 0 ]]; then
  echo ""
  echo "✓ No pending migrations for $ENVIRONMENT."
  exit 0
fi

# Handle dry-run mode
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo ""
  echo "Dry run complete. Pending migrations detected."
  echo "To apply them, run: pnpm db:deploy:$ENVIRONMENT"
  exit 0
fi

# Apply migrations
echo ""
echo "Applying pending migrations to $ENVIRONMENT..."
DATABASE_URL="$MIGRATION_URL" pnpm prisma migrate deploy

echo ""
echo "✓ Migrations successfully applied to $ENVIRONMENT."
