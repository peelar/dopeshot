#!/usr/bin/env bash
set -euo pipefail

# Run a SQL script against staging/prod/local via psql.
# Usage: ./scripts/sql/run.sh <environment> <script> [--email <email>] [--var key=value] [--url <postgres_url>] [--dry-run]
# Example: ./scripts/sql/run.sh staging upgrade-brand-user.sql --email user@example.com

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_DIR="$ROOT_DIR/scripts/sql"
APP_DIR="$ROOT_DIR/apps/app"

usage() {
  cat <<EOF
Usage: $0 <environment> <script> [options]
  environment: staging | prod | local
  script: filename in scripts/sql (with or without .sql)

Options:
  --email <email>      Set :email variable (common for user scripts)
  --var key=value      Set additional psql variables (repeatable)
  --url <postgres_url> Override connection URL directly
  --dry-run            Print target info without executing

Examples:
  $0 staging upgrade-brand-user.sql --email user@example.com
  $0 prod upgrade-brand-user --email user@example.com
  $0 local backfill-metadata --var limit=100
  $0 staging custom.sql --url 'postgresql://...'
EOF
}

ENVIRONMENT="${1:-}"
SCRIPT_NAME="${2:-}"

if [[ -z "$ENVIRONMENT" || -z "$SCRIPT_NAME" ]]; then
  usage
  exit 1
fi

shift 2

if [[ "$SCRIPT_NAME" != *.sql ]]; then
  SCRIPT_NAME="${SCRIPT_NAME}.sql"
fi

SCRIPT_PATH="$SQL_DIR/$SCRIPT_NAME"

if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo "Error: script not found: $SCRIPT_PATH"
  exit 1
fi

EMAIL=""
URL_OVERRIDE=""
DRY_RUN=0
VARS=()
VAR_KEYS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --email)
      EMAIL="${2:-}"
      shift 2
      ;;
    --var)
      VARS+=("${2:-}")
      shift 2
      ;;
    --url)
      URL_OVERRIDE="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

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

SQL_URL=""
ENV_FILE=""

if [[ -n "$URL_OVERRIDE" ]]; then
  SQL_URL="$(strip_quotes "$URL_OVERRIDE")"
  ENV_FILE="(override: --url)"
else
  if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "local" ]]; then
    echo "Error: environment must be 'staging', 'prod', or 'local' (or use --url)."
    exit 1
  fi

  if [[ "$ENVIRONMENT" == "staging" ]]; then
    ENV_FILE="${STAGING_ENV_FILE:-${ENV_FILE:-$APP_DIR/.env.local}}"
    DIRECT_FROM_FILE="$(read_env_value "DIRECT_DATABASE_URL" "$ENV_FILE")"
    DIRECT_ALT_FROM_FILE="$(read_env_value "DIRECT_URL" "$ENV_FILE")"
    SQL_URL="${STAGING_DIRECT_DATABASE_URL:-${DIRECT_DATABASE_URL:-${DIRECT_URL:-${DIRECT_FROM_FILE:-$DIRECT_ALT_FROM_FILE}}}}"
  elif [[ "$ENVIRONMENT" == "prod" ]]; then
    ENV_FILE="${PROD_ENV_FILE:-$APP_DIR/.env.prod}"
    DIRECT_FROM_FILE="$(read_env_value "DIRECT_DATABASE_URL" "$ENV_FILE")"
    DIRECT_ALT_FROM_FILE="$(read_env_value "DIRECT_URL" "$ENV_FILE")"
    SQL_URL="${PROD_DIRECT_DATABASE_URL:-${DIRECT_DATABASE_URL:-${DIRECT_URL:-${DIRECT_FROM_FILE:-$DIRECT_ALT_FROM_FILE}}}}"
  else
    ENV_FILE="${LOCAL_ENV_FILE:-${ENV_FILE:-$APP_DIR/.env.local}}"
    DIRECT_FROM_FILE="$(read_env_value "DIRECT_DATABASE_URL" "$ENV_FILE")"
    DIRECT_ALT_FROM_FILE="$(read_env_value "DIRECT_URL" "$ENV_FILE")"
    SQL_URL="${DIRECT_DATABASE_URL:-${DIRECT_URL:-${DIRECT_FROM_FILE:-$DIRECT_ALT_FROM_FILE}}}"
  fi

  SQL_URL="$(strip_quotes "${SQL_URL:-}")"
fi

if [[ -z "$SQL_URL" ]]; then
  cat <<EOF
No database URL found.

Set one of the following:
  - DIRECT_DATABASE_URL in $ENV_FILE
  - DIRECT_URL in $ENV_FILE
  - ${ENVIRONMENT^^}_DIRECT_DATABASE_URL in your shell
  - Use --url 'postgresql://...'
EOF
  exit 1
fi

if [[ "$ENVIRONMENT" == "prod" && "$DRY_RUN" -eq 0 ]]; then
  if [[ "${PROD_SQL_CONFIRMED:-}" != "yes" ]]; then
    cat <<'EOF'

WARNING: You are about to run a SQL script on PRODUCTION.

To proceed, run:
  PROD_SQL_CONFIRMED=yes ./scripts/sql/run.sh prod <script> [options]
EOF
    exit 1
  fi
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is not installed or not on PATH."
  exit 1
fi

PSQL_ARGS=("$SQL_URL" -v ON_ERROR_STOP=1)

if [[ -n "$EMAIL" ]]; then
  PSQL_ARGS+=(-v "email=$EMAIL")
  VAR_KEYS+=("email")
fi

if ((${#VARS[@]})); then
  for kv in "${VARS[@]}"; do
    if [[ "$kv" != *=* ]]; then
      echo "Error: --var expects key=value, got '$kv'"
      exit 1
    fi
    key="${kv%%=*}"
    value="${kv#*=}"
    if [[ -z "$key" ]]; then
      echo "Error: --var expects key=value, got '$kv'"
      exit 1
    fi
    PSQL_ARGS+=(-v "${key}=${value}")
    VAR_KEYS+=("$key")
  done
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run:"
  echo "  Environment: $ENVIRONMENT"
  echo "  Script: $SCRIPT_PATH"
  echo "  Env file: $ENV_FILE"
  if [[ "${VAR_KEYS[*]-}" != "" ]]; then
    echo "  Vars: ${VAR_KEYS[*]}"
  else
    echo "  Vars: (none)"
  fi
  exit 0
fi

echo "Running: $SCRIPT_PATH"
psql "${PSQL_ARGS[@]}" -f "$SCRIPT_PATH"
