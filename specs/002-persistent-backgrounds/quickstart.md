# Developer Quickstart: Persistent Background Management

**Feature**: 002-persistent-backgrounds
**Last Updated**: 2025-12-21

## Overview

This guide walks you through setting up the persistent background management feature in your local development environment. Follow these steps to get the feature running from scratch.

---

## Prerequisites

Ensure you have:
- [x] Node.js 18+ installed
- [x] pnpm package manager
- [x] Git repository cloned
- [x] Supabase project created (see [Phase 1 prompt in CLAUDE.md](../../../CLAUDE.md))
- [x] Environment variables configured (`.env.local`)

Required environment variables:
```bash
# Supabase (from Supabase dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (from Supabase dashboard → Project Settings → Database)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Better Auth (generate random secret)
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=http://localhost:3000
```

---

## Step 1: Database Migration

### 1.1 Apply Prisma Schema Changes

The schema changes are already defined in `data-model.md`. Apply them:

```bash
cd apps/app

# Generate migration from schema
npx prisma migrate dev --name add-background-models

# This will:
# - Create migration file in prisma/migrations/
# - Apply migration to database
# - Regenerate Prisma Client
```

**Expected output**:
```
✔ Generated Prisma Client
✔ The migration has been created successfully
```

### 1.2 Verify Migration

Check that tables were created:

```bash
npx prisma studio
```

Navigate to:
- `BackgroundAsset` table (should be empty)
- `CuratedBackground` table (should be empty)

---

## Step 2: Supabase Storage Setup

### 2.1 Create Storage Buckets

Open Supabase dashboard → Storage → Create bucket:

**Bucket 1: user-backgrounds** (Private)
- Name: `user-backgrounds`
- Public: ❌ (unchecked)
- File size limit: 5MB
- Allowed MIME types: `image/png, image/jpeg, image/webp, image/svg+xml`

**Bucket 2: curated-backgrounds** (Public)
- Name: `curated-backgrounds`
- Public: ✅ (checked)
- File size limit: 10MB
- Allowed MIME types: `image/png, image/jpeg, image/webp`

### 2.2 Configure Row-Level Security (RLS)

Navigate to Storage → Policies → user-backgrounds bucket → New Policy

**Policy 1: Users can upload to their own folder**
```sql
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()
);
```

**Policy 2: Users can read their own backgrounds**
```sql
CREATE POLICY "Users can read their own backgrounds"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()
);
```

**Policy 3: Users can delete their own backgrounds**
```sql
CREATE POLICY "Users can delete their own backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()
);
```

For `curated-backgrounds` bucket, policies are automatically set (public bucket = public read access).

---

## Step 3: Seed Curated Backgrounds

### 3.1 Prepare Background Images

Acquire or design 10 high-quality background images:
- Minimum dimensions: 1920x1080 (Full HD)
- File format: PNG or JPG
- File size: < 5MB each
- Suggested styles: gradients, abstract patterns, solid colors

**Naming convention**: `bg-{style}-{number}.{ext}`
- Example: `bg-gradient-01.png`, `bg-abstract-02.jpg`

### 3.2 Upload to Supabase Storage

1. Open Supabase dashboard → Storage → `curated-backgrounds` bucket
2. Click "Upload file"
3. Select all 10 background images
4. Upload (they'll be placed in bucket root, no folders)

**Verify**: Navigate to bucket → should see 10 files

### 3.3 Create Database Records

Create seed script:

```bash
# Create seed file
touch apps/app/prisma/seed-curated-backgrounds.ts
```

Add content:

```typescript
// apps/app/prisma/seed-curated-backgrounds.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const curatedBackgrounds = [
  {
    name: "Gradient Sunset",
    imagePath: "bg-gradient-01.png",
    tags: ["gradient", "warm", "orange"]
  },
  {
    name: "Abstract Waves",
    imagePath: "bg-gradient-02.png",
    tags: ["gradient", "blue", "abstract"]
  },
  {
    name: "Minimal Grid",
    imagePath: "bg-abstract-03.png",
    tags: ["pattern", "minimal", "monochrome"]
  },
  {
    name: "Colorful Gradient",
    imagePath: "bg-gradient-04.png",
    tags: ["gradient", "colorful", "vibrant"]
  },
  {
    name: "Soft Pastel",
    imagePath: "bg-gradient-05.png",
    tags: ["gradient", "pastel", "soft"]
  },
  {
    name: "Dark Abstract",
    imagePath: "bg-abstract-06.png",
    tags: ["abstract", "dark", "modern"]
  },
  {
    name: "Purple Haze",
    imagePath: "bg-gradient-07.png",
    tags: ["gradient", "purple", "dreamy"]
  },
  {
    name: "Green Organic",
    imagePath: "bg-gradient-08.png",
    tags: ["gradient", "green", "natural"]
  },
  {
    name: "Geometric Pattern",
    imagePath: "bg-pattern-09.png",
    tags: ["pattern", "geometric", "modern"]
  },
  {
    name: "Warm Gradient",
    imagePath: "bg-gradient-10.png",
    tags: ["gradient", "warm", "yellow"]
  }
];

async function main() {
  console.log('Seeding curated backgrounds...');

  for (const bg of curatedBackgrounds) {
    const created = await prisma.curatedBackground.upsert({
      where: { imagePath: bg.imagePath },  // Idempotent
      update: {},
      create: bg
    });
    console.log(`✓ ${created.name} (${created.imagePath})`);
  }

  console.log('✓ Seeded 10 curated backgrounds');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:

```bash
npx tsx prisma/seed-curated-backgrounds.ts
```

**Expected output**:
```
Seeding curated backgrounds...
✓ Gradient Sunset (bg-gradient-01.png)
✓ Abstract Waves (bg-gradient-02.png)
...
✓ Seeded 10 curated backgrounds
```

**Verify**: Open Prisma Studio → `CuratedBackground` table → should see 10 records

---

## Step 4: Install Dependencies

No new dependencies needed! Feature uses existing packages:
- `@supabase/supabase-js` (already installed)
- `@prisma/client` (already installed)
- `jotai` (already installed)
- `better-auth` (already installed)

Verify by running:

```bash
pnpm install  # Ensures lockfile is synced
```

---

## Step 5: Run Development Server

Start the Next.js dev server:

```bash
pnpm dev
```

**Expected output**:
```
  ▲ Next.js 16.0.7
  - Local:        http://localhost:3000
  - Ready in 2.1s
```

---

## Step 6: Test the Feature

### 6.1 Manual Testing Checklist

**As Anonymous User (Free Tier)**:
1. [ ] Open http://localhost:3000
2. [ ] Open background selector sidebar
3. [ ] Should see 10 curated backgrounds
4. [ ] Click a curated background → should apply to canvas
5. [ ] Try uploading a background → should work but NOT persist
6. [ ] Refresh page → uploaded background should be gone

**As Logged-in User**:
1. [ ] Create account or log in
2. [ ] Open background selector sidebar
3. [ ] Should see curated backgrounds + empty user section
4. [ ] Open brand sidebar → find background upload section
5. [ ] Upload a background image (< 5MB, PNG/JPG)
6. [ ] Should appear in user backgrounds section
7. [ ] Select uploaded background → should apply to canvas
8. [ ] Refresh page → background should persist
9. [ ] Try uploading duplicate filename → should show error
10. [ ] Delete background (with confirmation) → should disappear

### 6.2 API Testing (curl)

**Upload Background** (requires valid session cookie):
```bash
curl -X POST http://localhost:3000/api/background/upload \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -F "file=@/path/to/background.png"
```

**List Backgrounds** (no auth required):
```bash
curl http://localhost:3000/api/background/list
```

**Delete Background**:
```bash
curl -X DELETE http://localhost:3000/api/background/delete \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backgroundId":"clx123abc"}'
```

---

## Step 7: Run Tests

### 7.1 Unit Tests

```bash
pnpm test:ui
```

Expected coverage:
- `domain/background/validation.ts`: 100%
- `domain/background/types.ts`: 100%

### 7.2 Component Tests

```bash
pnpm test:ui
```

Expected coverage:
- `components/sidebar/background-selector.test.tsx`: ✓
- `components/sidebar/background-upload.test.tsx`: ✓

### 7.3 E2E Tests

```bash
# Install Playwright browsers (one-time)
npx playwright install chromium

# Run E2E tests
pnpm test:e2e
```

Expected tests:
- `tests/e2e/background-persistence.spec.ts`: ✓
- `tests/e2e/background-free-user.spec.ts`: ✓

---

## Troubleshooting

### Issue: "Bucket not found" error

**Cause**: Supabase buckets not created

**Fix**:
1. Open Supabase dashboard → Storage
2. Verify `user-backgrounds` and `curated-backgrounds` exist
3. Check bucket names match exactly (case-sensitive)

---

### Issue: "P2002: Unique constraint failed"

**Cause**: Trying to upload duplicate filename

**Expected behavior**: This is correct! Shows FR-014 working.

**Fix**: Rename file before uploading

---

### Issue: "Unauthorized" on upload

**Cause**: Not logged in or session expired

**Fix**:
1. Check `better-auth.session_token` cookie exists
2. Verify session in Prisma Studio → `Session` table
3. Log out and log back in

---

### Issue: Curated backgrounds not showing

**Cause**: Seed script not run or images not uploaded

**Fix**:
1. Check `CuratedBackground` table in Prisma Studio (should have 10 records)
2. Check Supabase Storage → `curated-backgrounds` bucket (should have 10 files)
3. Re-run seed script: `npx tsx prisma/seed-curated-backgrounds.ts`

---

### Issue: Uploaded backgrounds not persisting

**Cause**: API route not saving to database

**Fix**:
1. Check browser Network tab → `/api/background/upload` response
2. Check Prisma Studio → `BackgroundAsset` table for new records
3. Check server logs for Prisma errors

---

## Environment-Specific Setup

### Local Development

- Database: Supabase hosted Postgres
- Storage: Supabase hosted buckets
- Auth: better-auth with local sessions

### Staging/Production

Same setup as local, but:
- Use production Supabase project
- Update `NEXT_PUBLIC_SUPABASE_URL` and `DATABASE_URL`
- Update `BETTER_AUTH_URL` to production domain
- Re-run migrations: `npx prisma migrate deploy`
- Re-seed curated backgrounds

---

## Next Steps

After setup is complete:

1. **Review Implementation Plan**: See [plan.md](./plan.md) for architecture details
2. **Read API Contracts**: See [contracts/api-spec.yaml](./contracts/api-spec.yaml)
3. **Generate Tasks**: Run `/speckit.tasks` to create task breakdown
4. **Start Implementation**: Run `/speckit.implement` to execute tasks

---

## Resources

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**Quickstart Version**: 1.0.0
**Last Verified**: 2025-12-21
