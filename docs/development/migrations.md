# Database migrations: quick runbook

This makes Prisma + Supabase migrations "one-button" for local, staging, and prod.

## Quick Commands

```bash
# Development (staging database)
pnpm db:dev                    # Create and apply migrations

# Production (requires PROD_DIRECT_DATABASE_URL)
pnpm db:status:prod            # Check pending migrations (safe, always run first!)
pnpm db:deploy:prod            # Apply migrations to prod (with safety confirmation)
```

## Cheat sheet

- **Development**: `pnpm db:dev` (runs `prisma migrate dev`, creates and applies migrations to staging DB).
  - Uses `DATABASE_URL` from `apps/app/.env.local` (points to staging/dev Supabase)
- **Production**:
  - Check: `pnpm db:status:prod` (dry run, safe - always run this first!)
  - Deploy: `pnpm db:deploy:prod` (applies pending migrations with safety confirmation)
  - Uses `PROD_DIRECT_DATABASE_URL` env var
- `pnpm dev` auto-checks Prisma status and auto-applies migrations by default. Disable with `DEV_AUTO_MIGRATE=0`. Skip entirely with `DEV_SKIP_DB_CHECK=1`.
- Never run `prisma migrate dev` against prod.
- Always use the **direct** (non-pooled) connection string on port 5432.

## Env setup

**Runtime (app)**: Use `DATABASE_URL` (pooled connection is fine). Keep prod URL out of git; set in hosting env.

**Migrations**: Use direct connection strings. The migration scripts handle this automatically.

### Development (staging database)
Add your staging Supabase connection to `apps/app/.env.local`:
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Then run:
```bash
pnpm db:dev  # Create and apply migrations
```

### Production
- **Always export as environment variable** (never commit prod secrets!)
  ```bash
  export PROD_DIRECT_DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'
  pnpm db:status:prod   # always check first!
  pnpm db:deploy:prod   # apply (requires confirmation)
  ```

### Connection string formats

Supabase provides three types of connection strings. For migrations, use either **direct** or **session pooler**.

**Direct Connection (preferred for migrations)**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```
- Port: 5432
- IPv6 by default (IPv4 requires add-on)
- Best for: Persistent backend services, migrations, database tools
- Example: `postgresql://postgres:your_pw@db.abcdefghij.supabase.co:5432/postgres`

**Session Pooler (IPv4-compatible alternative)**
```
postgresql://postgres.[PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```
- Port: 5432
- IPv4 and IPv6 compatible
- Supports prepared statements (required for Prisma migrations)
- Best for: When direct IPv6 connection isn't available
- Example: `postgresql://postgres.abcdefghij:your_pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres`

**Transaction Pooler (NOT supported for migrations)**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres
```
- Port: 6543
- Does NOT support prepared statements
- Best for: Serverless/edge functions with transient connections
- ⚠️ **Will be rejected** by migration scripts

**Important notes:**
- Don't wrap URLs in quotes in `.env` files: `KEY=postgresql://...` (not `KEY="postgresql://..."`)
- Get connection strings from Supabase Dashboard → Settings → Database → Connection string
- Migration scripts automatically detect and reject port 6543 connections

### Shadow DB
Prisma creates and uses a shadow database automatically for `migrate dev` (local only).

## Standard workflow

1) Edit `apps/app/prisma/schema.prisma`.
2) Create migration: `pnpm db:dev --name <change>` (applies to staging DB immediately).
3) Test in your local app (connected to staging DB).
4) Commit the migration files.
5) Push/merge to `main`.
6) Deploy to prod: `pnpm db:deploy:prod`.
7) If deployment fails, fix forward (never rewrite past migrations), or run the recovery steps below.

## Quick migration workflows

### Development workflow
```bash
# 1. Edit schema
vim apps/app/prisma/schema.prisma

# 2. Create and apply migration
pnpm db:dev

# 3. Commit
git add apps/app/prisma/migrations/
git commit -m "Add migration"
```

### Production deployment
```bash
# 1. Export prod connection string
export PROD_DIRECT_DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROD-REF].supabase.co:5432/postgres'

# 2. Always check first! (safe, no changes)
pnpm db:status:prod

# 3. Apply migrations (requires explicit confirmation)
pnpm db:deploy:prod
```

### Safety features
- Transaction pooler (port 6543) is automatically blocked
- Prod deploys require `PROD_MIGRATE_CONFIRMED=yes` (set automatically by the script)
- Dry-run mode (`--dry-run`) checks status without applying
- All migrations are logged with clear environment indicators

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
