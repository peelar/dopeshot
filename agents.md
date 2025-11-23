# Agent Guide

## Overview
- Next.js 15 App Router, TypeScript, Tailwind 3, shadcn-style UI (local primitives), Supabase SSR/browser clients.
- Routes: `/` (landing), `/login`, `/dashboard` (auth), `/project/[id]/editor` (auth). Supabase magic link callback at `/auth/callback`.

## Key Files
- Root layout/styles: `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`.
- Auth/session: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `components/auth/login-form.tsx`, `app/auth/callback/route.ts`.
- Projects (stubbed): `lib/types.ts`, `lib/projects.ts`, server actions `app/(app)/dashboard/actions.ts`.
- Pages: landing `app/page.tsx`, dashboard `app/(app)/dashboard/page.tsx`, editor `app/(app)/project/[id]/editor/page.tsx`, login `app/login/page.tsx`.
- Layout: `components/layout-config.tsx` for manual layout configuration, `components/upload-placeholder.tsx` for asset uploads.
- UI primitives: `components/ui/*`, upload placeholder `components/upload-placeholder.tsx`.

## Env & Auth
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Magic link login: `components/auth/login-form.tsx` uses `supabase.auth.signInWithOtp` with redirect to `/auth/callback` which exchanges the code and redirects to `/dashboard`.
- Protected pages call `createServerSupabaseClient().auth.getUser()` and redirect to `/login` if missing.

## Commands
- Install: `npm install` (needs Node >= 18.18; Supabase prefers >= 20).
- Dev: `npm run dev`.
- Lint: `npm run lint`.

## Database & Migrations
- Database schema: `supabase/migrations/001_initial_schema.sql` defines tables for `projects`, `assets`, and `compositions`.
- Domain model types: `lib/types.ts` contains TypeScript types matching the database schema.
- **Use Supabase MCP for database operations**: Apply migrations using `mcp_supabase_apply_migration` for DDL operations. Use `mcp_supabase_execute_sql` for data queries only (not schema changes).
- Migration file location: `supabase/migrations/001_initial_schema.sql`.

## Notes
- Project data is in-memory stubs; DB wiring TBD.
- Tailwind is lean; avoid adding heavy global CSS unless necessary.
- Focus is on manual layout configuration; AI features will be added later.
- Node in repo was v18.13 during setup; upgrade locally to satisfy Next/Supabase engine warnings.
