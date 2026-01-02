# Quickstart: DopeShot Memory

**Feature Branch**: `001-memory`
**Date**: 2025-12-29

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (via Supabase)
- Supabase project with storage enabled

## Environment Setup

Add to `.env.local`:

```bash
# Already configured (verify these exist)
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

## Database Migration

```bash
# 1. Create the migration
npx prisma migrate dev --name add-memory-items

# 2. Generate Prisma client
npx prisma generate
```

## Supabase Storage Setup

Run in Supabase SQL Editor:

```sql
-- Create memory-screenshots bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memory-screenshots',
  'memory-screenshots',
  false,
  10485760,  -- 10MB
  ARRAY['image/png', 'image/jpeg']
);

-- RLS policy: Users can view own screenshots
CREATE POLICY "Users view own screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'memory-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test:ui
pnpm test:e2e
```

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/atoms/memory.ts` | Memory state atoms |
| `src/components/memory/memory-sidebar.tsx` | Sidebar component |
| `src/app/api/memory/` | API routes |
| `src/app/[shareHash]/page.tsx` | Public share route |
| `src/domain/memory/` | Domain logic |

## Quick Verification

1. Log in to the app
2. Create a design and export
3. Check memory sidebar - item should appear
4. Right-click item → Share
5. Visit the generated URL in incognito

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │MemorySidebar│  │ ExportFlow  │  │  ShareUrlPage       │ │
│  │  (Jotai)    │  │  (extends)  │  │  /[shareHash]       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         ▼                ▼                     ▼            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    API Routes                            ││
│  │  /api/memory/items  │  /api/memory/shared/{hash}        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Prisma    │  │  Supabase   │  │     better-auth     │ │
│  │ MemoryItem  │  │   Storage   │  │      Sessions       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Logged-out user can export without interruption
- [ ] Logged-in user sees memory item after export
- [ ] Memory sidebar shows items in correct order
- [ ] Clicking memory item loads config into editor
- [ ] Right-click shows context menu
- [ ] Share generates URL and copies to clipboard
- [ ] Shared URL loads for anonymous visitors
- [ ] Delete removes item and invalidates share URL
- [ ] Duplicate config doesn't create new item
- [ ] Post-export nudge appears for logged-out users
