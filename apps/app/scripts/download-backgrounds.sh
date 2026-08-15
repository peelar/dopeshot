#!/usr/bin/env bash
# Download published AI backgrounds from Supabase Storage into public/.
# Requires: supabase CLI, SUPABASE_ACCESS_TOKEN, and a linked project (or --project-ref).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/backgrounds/catalog"
PROJECT_REF="${SUPABASE_PROJECT_REF:-kktkeiwdsfxgarhwvosd}"
BUCKET="${SUPABASE_BACKGROUNDS_BUCKET:-ai-backgrounds}"

mkdir -p "$DEST"

if ! command -v supabase >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then
  echo "supabase CLI is required" >&2
  exit 1
fi

CLI=(npx supabase)
if command -v supabase >/dev/null 2>&1; then
  CLI=(supabase)
fi

echo "Listing $BUCKET from project $PROJECT_REF..."
"${CLI[@]}" storage ls --experimental "ss://$BUCKET" --project-ref "$PROJECT_REF"

echo "Copying objects into $DEST..."
"${CLI[@]}" storage cp --experimental --recursive \
  "ss://$BUCKET" \
  "$DEST" \
  --project-ref "$PROJECT_REF"

echo "Done. Update src/domain/backgrounds/catalog.json to match downloaded files."
