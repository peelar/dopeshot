# Agent Guide

## Overview

- Next.js 15 App Router, TypeScript, Tailwind 3, shadcn-style UI (local primitives), Supabase SSR/browser clients.
- Routes: `/` (playground), `/login`, `/dashboard` (auth), `/project/[id]/editor` (auth). Supabase magic link callback at `/auth/callback`.

## Key Files

- Root layout/styles: `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`.
- Auth/session: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `components/auth/login-form.tsx`, `app/auth/callback/route.ts`.
- Pages: playground `app/page.tsx`, dashboard `app/(app)/dashboard/page.tsx`, editor `app/(app)/project/[id]/editor/page.tsx`, login `app/login/page.tsx`.
- Layout system:
  - Types: `domain/layout/types.ts` - Simple `LayoutConfig` with `templateId`, `variant`, `text`, `colors`, `assets`.
  - Templates: `domain/layout/templates.ts` - Template registry with React components.
  - Template components: `components/templates/*.tsx` - React components that render layouts.
  - Preview: `components/cover-preview.tsx` - Renders template components.
  - Config panel: `components/layout-config.tsx` - UI for selecting templates, variants, editing text, and selecting assets.
  - Export: `domain/layout/export.ts` - PNG export functionality.
- Assets: `domain/asset/types.ts`, `domain/asset/utils.ts`.
- UI primitives: `components/ui/*`, upload dropzone `components/upload-dropzone.tsx`.
- Utils: `utils.ts` - `cn()` helper for className merging.

## Layout System Architecture

The layout system is simplified and data-driven:

- **Templates**: Each template is a React component in `components/templates/` that accepts a `LayoutConfig` and renders the layout.
- **Config**: Simple data structure with `templateId`, `variant` (layout position), `text` (title/subtitle), `colors` (internal, not exposed in UI), and `assets` (screenshot/logo IDs).
- **Variants**: Each template defines its own variants (e.g., "left", "right", "center" for image position).
- **No complex primitives**: The old grid-based primitive system has been removed. Templates handle all layout logic internally using Tailwind directly.

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
- Layout system is simplified: React template components with simple data-driven props, suitable for future LLM integration.
- Node in repo was v18.13 during setup; upgrade locally to satisfy Next/Supabase engine warnings.
- In the UI, don't mention what technology is used ("Upload with Supabase"). Write copy as you would for a real product. If you see an example of that, update it.
- The workflow is as follows: you are handed over a spec that you should follow in the implementation. However, you have the authority to deviate from the spec if you think it's necessary to improve the product. Especially on the implementation details. Just make sure to communicate your decisions to the user.
- Whenever you are given a task, you should always look for ways to simplify the implementation. Don't add unnecessary complexity to the implementation. That doesn't mean you should ignore the spec, but you should always look for ways to simplify the implementation. Same goes for refactoring: when you touch a file, you should always look for ways to simplify the implementation and remove unnecessary complexity.
- Whenever possible, try to avoid creating "utils.ts". Instead, collocate the utility functions in the file where they are used or create domain-specific modules.
- Whenever you have to build a UI component, you should always search if it already exists in the shadcn-style UI library. If it does, you should use it. If it doesn't, you should build it yourself.
