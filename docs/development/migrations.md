# Database migrations: quick runbook

This makes Prisma + Supabase migrations “one-button” for local and prod.

## Cheat sheet

- Local dev: `pnpm db:dev` (runs `prisma migrate dev`, updates your local DB + generates client).
- Status: `pnpm db:status` (add `DATABASE_URL=...` to point at non-local DB).
- Prod/staging: `DATABASE_URL='<direct-connection>' pnpm db:deploy`.
- Never run `prisma migrate dev` against prod.
- Always use the **direct** (non-pooled) `DATABASE_URL` when deploying migrations.

## Env setup

- Local: put your local/Postgres URL in `apps/app/.env` or `.env.local` as `DATABASE_URL=...`. Prisma reads it automatically.
- Prod/staging: export `DATABASE_URL` for the session or prefix the command. Use Supabase “direct connection string” (not pooled).
- Shadow DB: Prisma creates/uses it automatically for `migrate dev`.

## Standard workflow

1) Edit `apps/app/prisma/schema.prisma`.
2) Create migration locally: `pnpm db:dev --name <change>`.
3) Verify locally (app + tests as needed).
4) Commit the migration files.
5) Push/merge to `main`. CI will run `prisma migrate deploy` on prod.
6) If CI fails, fix forward (never rewrite past migrations), or run the recovery steps below.

## Prod/staging deployment (manual)

```bash
cd apps/app
DATABASE_URL='<direct-connection>' pnpm prisma migrate deploy
```

To check first:
```bash
DATABASE_URL='<direct-connection>' pnpm prisma migrate status
```

## Recovery when a migration fails

1) Read the failing migration name and error.
2) If the change already exists (e.g., column added manually), mark it applied:
   `DATABASE_URL=... pnpm prisma migrate resolve --applied <migration_name>`
3) If it partially ran and you need to retry, mark it rolled back:
   `DATABASE_URL=... pnpm prisma migrate resolve --rolled-back <migration_name>`
4) Re-run deploy: `DATABASE_URL=... pnpm prisma migrate deploy`

Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` only as a last-resort hotfix; prefer proper migrations so `_prisma_migrations` stays accurate.

## Expand/contract discipline

- Expand first (additive columns/tables, defaults/nullables). Ship code that reads new shape.
- Contract/rename later with a follow-up migration once the code no longer depends on old fields.
- Avoid destructive changes in the same deploy as app changes.

## Supabase SQL editor (when you must)

- Safe to run additive statements directly; keep them idempotent.
- After any manual SQL, mirror the change in Prisma schema and add a migration to keep histories aligned.
- For quick data tweaks (e.g., promote a user), prefer idempotent scripts in `scripts/`.

## CI/CD expectations

- `.github/workflows/migrate-prod.yml` runs on every push to `main` and applies pending migrations using `DIRECT_DATABASE_URL`.
- Manual trigger remains available (`workflow_dispatch`) with optional `skip_vercel_deploy`.
- Vercel promote/deploy can stay manual; migrations run independently on `main`.

## Quick sanity checks

- Does `_prisma_migrations` show the migration as applied? `pnpm db:status`.
- Does the table/column exist? `SELECT column_name FROM information_schema.columns WHERE table_name='user_metadata';`
- Can you roll forward without dropping data? If not, stop and plan an expand/contract pair.
