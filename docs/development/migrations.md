# Database migrations: quick runbook

This makes Prisma + Supabase migrations “one-button” for local and prod.

## Cheat sheet

- Local dev: `pnpm db:dev` (runs `prisma migrate dev`, updates your local DB + generates client).
- Staging (uses `apps/app/.env.local`): `pnpm db:deploy:staging` to apply pending migrations, `pnpm db:status:staging` to just check. Supabase session pooler on port 5432 is OK; avoid the transaction pooler on 6543.
- Prod: `DIRECT_DATABASE_URL='<direct-connection>' pnpm db:deploy`.
- `pnpm dev` auto-checks Prisma status and auto-applies staging migrations by default. Disable with `DEV_AUTO_MIGRATE=0 pnpm dev`. Skip entirely with `DEV_SKIP_DB_CHECK=1` if you're only working on non-app parts.
- Status: `pnpm db:status` (add `DATABASE_URL=...` to point at non-local DB).
- Never run `prisma migrate dev` against prod.
- Always use the **direct** (non-pooled) `DATABASE_URL` when deploying migrations.

## Env setup

- Runtime (app): use `DATABASE_URL` (pooled or standard connection). Keep prod URL out of git; set in hosting env.
- Migrations: prefer `DIRECT_DATABASE_URL` (Supabase direct / non-pooled). The scripts set `DATABASE_URL=${DIRECT_DATABASE_URL:-$DATABASE_URL}` before running Prisma CLI.

- Local/staging: put your staging URL in `apps/app/.env.local` as `DATABASE_URL=...` (pooled) and `DIRECT_DATABASE_URL=...` (direct **or session pooler** on 5432). Prisma reads it automatically. The staging helper also respects `STAGING_ENV_FILE=/path/to/.env` if you keep a separate file.
- Do not wrap URLs in quotes in `.env` files; use `KEY=postgresql://...`.
- Prod/staging: set `DIRECT_DATABASE_URL` for deploy/status; pooled `DATABASE_URL` can remain for runtime. Use Supabase “direct connection string” for direct.
- Supabase direct URL shape: `postgresql://postgres:<pw>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require` (no `pooler` in host). Pooled URL (`...pooler...:6543?...pgbouncer=true`) is for runtime only.
- Shadow DB: Prisma creates/uses it automatically for `migrate dev`.

## Standard workflow

1) Edit `apps/app/prisma/schema.prisma`.
2) Create migration locally: `pnpm db:dev --name <change>`.
3) Verify locally (app + tests as needed).
4) Commit the migration files.
5) Push/merge to `main`. CI will run `prisma migrate deploy` on prod.
6) If CI fails, fix forward (never rewrite past migrations), or run the recovery steps below.

## Staging helper (local)

- Apply: `pnpm db:deploy:staging` (uses `DIRECT_DATABASE_URL` from `.env.local` by default).
- Check only: `pnpm db:status:staging` (same URL resolution, but `AUTO_APPLY=0` under the hood).
- Guard rails: refuses to run with the transaction pooler on port 6543. Session pooler on 5432 is allowed (Prisma migrate supports it), though direct `db.<ref>.supabase.co:5432` also works. Override the env file with `STAGING_ENV_FILE=~/secrets/.env.staging`.
- Auto on dev start: set `DEV_AUTO_MIGRATE=1 pnpm dev` to apply staging migrations automatically when `predev` runs. Set `DEV_SKIP_DB_CHECK=1` to bypass entirely.

## Prod deployment (manual)

```bash
cd apps/app
DIRECT_DATABASE_URL='<direct-connection>' pnpm prisma migrate deploy
```

To check first:
```bash
DIRECT_DATABASE_URL='<direct-connection>' pnpm prisma migrate status
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
