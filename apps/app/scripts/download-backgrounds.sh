#!/usr/bin/env bash
# Snapshot catalog backgrounds from the (legacy) dopeshot Supabase project into public/.
# Requires SUPABASE_ACCESS_TOKEN. The published AI catalog table was empty; curated-backgrounds
# held the only reusable images.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/backgrounds/catalog"
PROJECT_REF="${SUPABASE_PROJECT_REF:-xgvseaushfumwnvkhdyx}"
BUCKET="${SUPABASE_BACKGROUNDS_BUCKET:-curated-backgrounds}"

mkdir -p "$DEST"

CLI=(npx supabase)
if command -v supabase >/dev/null 2>&1; then
  CLI=(supabase)
fi

echo "Listing $BUCKET from project $PROJECT_REF..."
"${CLI[@]}" storage ls --experimental -r "ss:///$BUCKET" --project-ref "$PROJECT_REF"

echo "Copying objects into $DEST..."
"${CLI[@]}" storage cp --experimental --recursive \
  "ss:///$BUCKET" \
  "$DEST" \
  --project-ref "$PROJECT_REF"

echo "Done. Flatten files if needed and update src/domain/backgrounds/catalog.json."
