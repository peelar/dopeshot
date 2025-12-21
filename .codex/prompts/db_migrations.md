---
description: Run the dopeshot database migration flow (staging local, production in CI/CD).
---

# Database Migrations

Use this command to follow the approved migration flow: local changes go to staging, production is CI/CD only.

## Guardrails

- Never run production migrations locally.
- Never use `prisma db push` or `prisma migrate reset` against production.
- Use `DIRECT_URL` (direct connection) for all Prisma CLI migrations.

## Local and Staging Workflow

1. Confirm `.env.local` has `DIRECT_URL` pointing to the staging direct connection.
2. Create and apply a migration:
   `pnpm --filter dopeshot-app db:migrate:dev --name <change>`
3. Optionally validate status:
   `pnpm --filter dopeshot-app db:migrate:status`

## CI/CD Production Workflow

1. CI sets `DIRECT_URL` to production (secret).
2. Run:
   `pnpm --filter dopeshot-app db:migrate:deploy`
3. Deploy the app after migrations succeed.

## CI Secrets

- `STAGING_DIRECT_URL` for staging migration job.
- `PROD_DIRECT_URL` for production migration job.
