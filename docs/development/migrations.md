# Persistence

dopeshot is a client-side editor. There is no database, no Prisma, and no Supabase.

- Brand settings persist in the browser via Jotai `atomWithStorage("dopeshot:brandSettings")`.
- Personal background uploads live in session state only (`URL.createObjectURL`).
- Published AI/catalog backgrounds are static files in `apps/app/public/backgrounds/catalog/` with a manifest at `apps/app/src/domain/backgrounds/catalog.json`.
- Tweet embeds still use `/api/tweet`.

To refresh the catalog snapshot from an old storage bucket, use `apps/app/scripts/download-backgrounds.sh` (requires the Supabase CLI and access token), then update `catalog.json`.
