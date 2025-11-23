# Agent Guide

## Overview
- Next.js 15 App Router, TypeScript, Tailwind 3, shadcn-style UI (local primitives), Vercel AI SDK, Supabase SSR/browser clients.
- Routes: `/` (landing), `/login`, `/dashboard` (auth), `/project/[id]/editor` (auth). AI chat endpoint at `/api/chat`. Supabase magic link callback at `/auth/callback`.

## Key Files
- Root layout/styles: `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`.
- Auth/session: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `components/auth/login-form.tsx`, `app/auth/callback/route.ts`.
- Projects (stubbed): `lib/types.ts`, `lib/projects.ts`, server actions `app/(app)/dashboard/actions.ts`.
- Pages: landing `app/page.tsx`, dashboard `app/(app)/dashboard/page.tsx`, editor `app/(app)/project/[id]/editor/page.tsx`, login `app/login/page.tsx`.
- AI: `app/api/chat/route.ts` (uses `ai` + `@ai-sdk/openai` tool calling fallback if no key), UI `components/design-chat.tsx`.
- UI primitives: `components/ui/*`, upload placeholder `components/upload-placeholder.tsx`.

## Env & Auth
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional `OPENAI_API_KEY` for live chat.
- Magic link login: `components/auth/login-form.tsx` uses `supabase.auth.signInWithOtp` with redirect to `/auth/callback` which exchanges the code and redirects to `/dashboard`.
- Protected pages call `createServerSupabaseClient().auth.getUser()` and redirect to `/login` if missing.

## Commands
- Install: `npm install` (needs Node >= 18.18; Supabase prefers >= 20).
- Dev: `npm run dev`.
- Lint: `npm run lint`.

## Notes
- Project data is in-memory stubs; DB wiring TBD.
- Tailwind is lean; avoid adding heavy global CSS unless necessary.
- If AI chat errors, ensure `OPENAI_API_KEY` is set; otherwise a fallback message is returned.
- Node in repo was v18.13 during setup; upgrade locally to satisfy Next/Supabase engine warnings.
