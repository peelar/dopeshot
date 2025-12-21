# Prisma + Supabase + BetterAuth Audit Plan

## Purpose
Validate data safety, correctness, and operational simplicity across Prisma ORM, Supabase (DB + Storage), and BetterAuth.

## Scope
- Authentication/session handling (BetterAuth + cookies + server routes).
- Database access patterns (Prisma DAL, direct Supabase client usage).
- Storage access patterns (Supabase Storage admin vs anon clients).
- Schema/migration alignment between Prisma and Supabase SQL.

## Key risks to validate
1. **Schema divergence** between Prisma migrations and Supabase SQL migrations.
2. **Authorization bypass** due to mixing BetterAuth sessions with Supabase RLS.
3. **Storage access leaks** from signed URLs or public bucket exposure.
4. **Data integrity gaps** (orphaned storage objects, duplicate records, missing validation).

## Audit steps
### 1) Map auth/session flow and trust boundaries
- Confirm how BetterAuth issues and validates sessions.
- Verify server route auth gating for every data or storage mutation.
- Check for client-side direct DB queries that assume Supabase auth context.

### 2) Inventory DB operations and authorization model
- Enumerate all Prisma DAL operations and ensure user scoping is enforced.
- Enumerate all Supabase DB operations and validate RLS compatibility.
- Validate whether any routes bypass DAL or rely on unsafe operations.

### 3) Validate schema/migration alignment
- Compare Prisma schema and migrations against Supabase SQL schema.
- Confirm whether Supabase auth tables are managed by Supabase or Prisma.
- Ensure foreign keys, types, and schemas (public/auth/storage) match reality.

### 4) Review storage access patterns
- List every storage upload/delete/signed URL path.
- Validate bucket policies vs code usage (admin vs anon clients).
- Check cleanup behavior on failed DB writes or failed uploads.

### 5) Document findings and remediation options
- Provide a prioritized list of issues and actionable fixes.
- Provide a recommended direction (BetterAuth-first vs Supabase-auth-first).

## Evidence sources (current code)
- BetterAuth server config: `apps/app/src/lib/auth/auth-server.ts`
- Session verification: `apps/app/src/lib/auth/session.ts`
- Prisma client and pooling: `apps/app/src/lib/prisma.ts`
- DAL user scoping: `apps/app/src/lib/data/dal.ts`
- Supabase admin client: `apps/app/src/lib/supabase-admin.ts`
- Supabase anon client: `apps/app/src/lib/supabase-db.ts`
- Background API routes: `apps/app/src/app/api/background/upload/route.ts`, `apps/app/src/app/api/background/list/route.ts`, `apps/app/src/app/api/background/delete/route.ts`
- Brand API routes: `apps/app/src/app/api/brand/profile/route.ts`, `apps/app/src/app/api/brand/update-profile/route.ts`, `apps/app/src/app/api/brand/upload-logo/route.ts`
- Client hooks using Supabase DB: `apps/app/src/hooks/use-onboarding-flow.ts`, `apps/app/src/hooks/use-brand-logo-auto-apply.ts`
- Prisma schema: `apps/app/prisma/schema.prisma`
- Prisma migration: `apps/app/prisma/migrations/20251221133601_add_background_models/migration.sql`
- Supabase SQL migration: `apps/app/supabase/migrations/20240401T000000_init.sql`

## Deliverables
- A written audit report with severity-ranked findings.
- A short decision memo recommending one of:
  - **BetterAuth + Prisma-first** with Supabase Storage only.
  - **Supabase Auth + Prisma external tables** with consistent RLS.
