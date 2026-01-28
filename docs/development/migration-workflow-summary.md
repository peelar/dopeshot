# Migration Workflow Summary

This document provides a quick reference for the unified database migration workflow.

## Overview

All database migrations now use a single script (`scripts/migrate.sh`) that handles both staging and prod environments with consistent behavior and safety checks.

## Command Structure

From the project root, you can run:

```bash
pnpm db:status:staging   # Check staging (dry-run, safe)
pnpm db:deploy:staging   # Apply to staging

pnpm db:status:prod      # Check prod (dry-run, safe)
pnpm db:deploy:prod      # Apply to prod (with confirmation)
```

## Environment Variable Priority

The scripts look for connection strings in this order:

**For staging:**
1. `STAGING_DIRECT_DATABASE_URL` (environment variable)
2. `DIRECT_DATABASE_URL` from `apps/app/.env.local`
3. `DIRECT_URL` from `apps/app/.env.local`
4. Custom file via `STAGING_ENV_FILE` environment variable

**For prod:**
1. `PROD_DIRECT_DATABASE_URL` (environment variable) - **recommended**
2. `DIRECT_DATABASE_URL` from `apps/app/.env.prod` (not recommended for secrets)
3. `DIRECT_URL` from `apps/app/.env.prod`
4. Custom file via `PROD_ENV_FILE` environment variable

## Typical Workflows

### Daily Development (Staging)

```bash
# Option 1: Export once per terminal session
export STAGING_DIRECT_DATABASE_URL='postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'

# Then run commands as needed
pnpm db:status:staging   # Safe check
pnpm db:deploy:staging   # Apply when ready

# Option 2: Store in .env.local (convenient for single environment)
echo "DIRECT_DATABASE_URL=postgresql://..." >> apps/app/.env.local
pnpm db:deploy:staging   # Just works
```

### Production Deployment

```bash
# Step 1: Always check first (no changes made)
export PROD_DIRECT_DATABASE_URL='postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'
pnpm db:status:prod

# Step 2: Review the output, ensure migrations are correct

# Step 3: Apply (requires explicit confirmation)
pnpm db:deploy:prod
```

### One-liner for Quick Prod Deployment

```bash
# Check and apply in sequence (still requires confirmation)
PROD_DIRECT_DATABASE_URL='postgresql://...' pnpm db:status:prod && \
PROD_DIRECT_DATABASE_URL='postgresql://...' pnpm db:deploy:prod
```

## Safety Features

### Automatic Checks
- ✅ Blocks transaction pooler (port 6543) automatically
- ✅ Detects connection type and shows informative messages
- ✅ Validates database connectivity before applying
- ✅ Shows clear environment indicators (staging vs prod)

### Production Safeguards
- ✅ Requires `PROD_MIGRATE_CONFIRMED=yes` (automatically set by `pnpm db:deploy:prod`)
- ✅ Dry-run available via `pnpm db:status:prod`
- ✅ Clear warnings and confirmation prompts

### Preventing Mistakes
- ✅ No ambiguous `db:deploy` command (must specify staging or prod)
- ✅ No direct `pnpm prisma` commands needed (consistent interface)
- ✅ Environment-specific variable names prevent confusion

## Connection String Reference

### Direct Connection (Preferred)
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```
- Port: 5432
- Best for migrations
- IPv6 by default

### Session Pooler (Alternative)
```
postgresql://postgres.[PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```
- Port: 5432
- IPv4/IPv6 compatible
- Supports prepared statements

### Transaction Pooler (NOT Supported)
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres
```
- Port: 6543
- ❌ Does not support prepared statements
- ❌ Blocked by migration scripts

## Migration Lifecycle

### Creating a New Migration

```bash
# 1. Make schema changes
vim apps/app/prisma/schema.prisma

# 2. Create migration locally
pnpm db:dev --name add_user_metadata

# 3. Test locally
pnpm dev
# Test the changes in your app

# 4. Commit migration files
git add apps/app/prisma/migrations/
git commit -m "Add user_metadata table"
```

### Deploying to Staging

```bash
# 1. Pull latest
git pull origin main

# 2. Check status
pnpm db:status:staging

# 3. Apply migrations
pnpm db:deploy:staging

# 4. Verify app still works
# Visit staging environment and test
```

### Deploying to Production

```bash
# 1. Ensure staging is stable

# 2. Check prod status
export PROD_DIRECT_DATABASE_URL='postgresql://...'
pnpm db:status:prod

# 3. Review migration list carefully

# 4. Apply to prod
pnpm db:deploy:prod

# 5. Monitor application
# Watch logs, check error rates
```

## Troubleshooting

### "No DIRECT_DATABASE_URL found"

**Solution:** Export the environment variable or add it to your `.env.local`:

```bash
# Terminal
export STAGING_DIRECT_DATABASE_URL='postgresql://...'

# Or in apps/app/.env.local
DIRECT_DATABASE_URL=postgresql://...
```

### "Refusing to run migrations against transaction pooler"

**Problem:** You're using port 6543 (transaction pooler)

**Solution:** Use port 5432 instead (direct or session pooler):
```bash
# Change from this (port 6543)
postgresql://postgres:pw@db.xyz.supabase.co:6543/postgres

# To this (port 5432)
postgresql://postgres:pw@db.xyz.supabase.co:5432/postgres
```

### "prisma migrate status failed (drift or connectivity)"

**Possible causes:**
1. Wrong connection string
2. Database is down
3. Schema drift (manual changes outside Prisma)

**Solution:** Check connectivity and run `prisma migrate resolve` if needed.

### Production confirmation prompt

**Problem:** Script asks for confirmation when running prod migrations

**This is intentional!** It's a safety feature. If you really want to skip it (not recommended):

```bash
PROD_MIGRATE_CONFIRMED=yes ./scripts/migrate.sh prod
```

But the `pnpm db:deploy:prod` script sets this automatically.

## Comparison: Old vs New

### Old Workflow (Confusing)
```bash
# Staging: multiple scripts, env var juggling
pnpm db:deploy:staging
AUTO_APPLY=0 pnpm db:status:staging

# Prod: manual commands, easy to mess up
cd apps/app
DIRECT_DATABASE_URL='...' pnpm db:deploy
```

### New Workflow (Clean)
```bash
# Staging: consistent commands
pnpm db:status:staging   # check
pnpm db:deploy:staging   # apply

# Prod: consistent commands with safety
pnpm db:status:prod      # check
pnpm db:deploy:prod      # apply
```

## Benefits

1. **Consistency**: Same command pattern for staging and prod
2. **Safety**: Built-in checks and confirmations
3. **Clarity**: Explicit environment names in every command
4. **Simplicity**: No need to remember which env var to use
5. **Flexibility**: Multiple ways to configure (env vars, files, or inline)

## When to Use Each Command

| Command | When to Use |
|---------|------------|
| `pnpm db:dev` | Creating new migrations locally |
| `pnpm db:status:staging` | Before deploying to staging, or checking staging state |
| `pnpm db:deploy:staging` | After merging to main, to update staging schema |
| `pnpm db:status:prod` | **Always** before prod deployment, to preview changes |
| `pnpm db:deploy:prod` | After successful staging testing, to update prod schema |

## Best Practices

1. **Always run status first**: Especially for prod, check what will be applied
2. **Test on staging**: Never deploy migrations directly to prod without staging verification
3. **Use expand/contract pattern**: Additive changes first, removals later
4. **Keep migrations small**: One logical change per migration
5. **Never edit committed migrations**: Create new migrations to fix issues
6. **Monitor after deployment**: Watch error logs and database performance
7. **Have a rollback plan**: Know how to revert schema changes if needed

## Getting Connection Strings

1. Go to Supabase Dashboard
2. Select your project
3. Navigate to **Settings** → **Database**
4. Click **Connection string**
5. Choose **URI** format
6. Use the **Direct connection** (port 5432) or **Session** mode
7. Copy and replace `[YOUR-PASSWORD]` with your actual database password

---

**Questions?** Check the main migrations docs: `docs/development/migrations.md`
