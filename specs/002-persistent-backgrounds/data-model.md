# Data Model: Persistent Background Management

**Feature**: 002-persistent-backgrounds
**Date**: 2025-12-21
**Status**: Ready for implementation

## Overview

This document defines the database schema changes required for persistent background management. The design follows Prisma best practices and integrates with the existing `User` model.

---

## Schema Changes

### New Models

#### 1. BackgroundAsset

Stores user-uploaded background images with metadata.

```prisma
model BackgroundAsset {
  id          String   @id @default(cuid())
  userId      String
  name        String   // Original filename (sanitized)
  imagePath   String   // Supabase Storage path: user-backgrounds/{userId}/{filename}
  fileSize    Int      // File size in bytes
  dimensions  Json?    // Optional: { width: number, height: number }
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])  // Enforce unique filenames per user
  @@index([userId, createdAt])  // Optimize list queries
  @@map("background_assets")
}
```

**Field Descriptions**:
- `id`: Primary key (CUID for short, URL-friendly IDs)
- `userId`: Foreign key to User (enforces ownership)
- `name`: Original filename, sanitized for safety (e.g., "gradient-sunset.png")
- `imagePath`: Full Supabase Storage path for retrieval
- `fileSize`: Used for analytics and storage quota tracking
- `dimensions`: Optional metadata for responsive image handling
- `createdAt`: Timestamp for sorting (newest first)

**Constraints**:
- `@@unique([userId, name])`: Prevents duplicate filenames per user (FR-014)
- `@@index([userId, createdAt])`: Optimizes `getUserBackgrounds()` query

**Cascade Behavior**:
- `onDelete: Cascade`: Deleting a user removes all their backgrounds

---

#### 2. CuratedBackground

Stores curated background images available to all users (especially free tier).

```prisma
model CuratedBackground {
  id          String   @id @default(cuid())
  name        String   // Display name (e.g., "Abstract Waves")
  imagePath   String   // Supabase Storage path: curated-backgrounds/{filename}
  tags        String[] // Optional tags for future categorization (e.g., ["gradient", "colorful"])
  isActive    Boolean  @default(true)  // Admin can hide backgrounds without deleting
  createdAt   DateTime @default(now())

  @@index([isActive])  // Optimize active backgrounds query
  @@map("curated_backgrounds")
}
```

**Field Descriptions**:
- `id`: Primary key (CUID)
- `name`: Human-readable name shown in selector
- `imagePath`: Path in public Supabase Storage bucket
- `tags`: Array of strings for future filtering (e.g., by color scheme)
- `isActive`: Soft-delete mechanism (admin can hide without removing file)
- `createdAt`: Timestamp for ordering (admin can feature newest)

**Constraints**:
- `@@index([isActive])`: Optimizes `getActiveCuratedBackgrounds()` query

**No User Relationship**: Curated backgrounds are global, not owned by any user

---

### Updated Models

#### User Model Updates

Add relationship to `BackgroundAsset`:

```prisma
model User {
  // ... existing fields ...

  sessions          Session[]
  accounts          Account[]
  brandProfile      BrandProfile?
  userMetadata      UserMetadata?
  generatedAssets   GeneratedAsset[]
  backgroundAssets  BackgroundAsset[]  // NEW: One-to-many relationship

  // ... rest of model ...
}
```

**Impact**: Enables cascading deletes and relational queries

---

## Entity Relationships

```
User (1) ──────< (many) BackgroundAsset
  │
  ├──< Session
  ├──< Account
  ├──< BrandProfile (1:1)
  ├──< UserMetadata (1:1)
  └──< GeneratedAsset

CuratedBackground (standalone, no relationships)
```

---

## Query Patterns

### 1. Get User's Backgrounds

```typescript
// apps/app/src/lib/data/dal.ts (extend getUserDb)
async function getUserBackgrounds(userId: string) {
  const db = getUserDb(userId);
  return db.backgroundAsset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      imagePath: true,
      fileSize: true,
      dimensions: true,
      createdAt: true,
    }
  });
}
```

**Performance**: Uses `@@index([userId, createdAt])` for O(log n) lookup

---

### 2. Check Filename Uniqueness (Implicit)

```typescript
// Handled by @@unique([userId, name]) constraint
try {
  await db.backgroundAsset.create({
    data: { userId, name, imagePath, fileSize }
  });
} catch (error) {
  if (error.code === 'P2002') {
    // Duplicate filename error
  }
}
```

**Performance**: Unique constraint check is O(log n) via index

---

### 3. Get Active Curated Backgrounds

```typescript
async function getActiveCuratedBackgrounds() {
  return prisma.curatedBackground.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      imagePath: true,
      tags: true,
    }
  });
}
```

**Performance**: Uses `@@index([isActive])` for O(log n) lookup

---

### 4. Delete User Background

```typescript
async function deleteUserBackground(userId: string, backgroundId: string) {
  const db = getUserDb(userId);

  // Get background to find imagePath
  const background = await db.backgroundAsset.findUnique({
    where: { id: backgroundId }
  });

  if (!background) {
    throw new Error('Background not found');
  }

  // Delete from Storage first
  await supabaseAdmin.storage
    .from('user-backgrounds')
    .remove([background.imagePath]);

  // Then delete from DB
  await db.backgroundAsset.delete({
    where: { id: backgroundId }
  });

  return background;
}
```

**Transaction Safety**: Storage delete is idempotent; DB delete is final

---

## Migration Strategy

### Migration File

```prisma
-- CreateTable
CREATE TABLE "background_assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "dimensions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curated_backgrounds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curated_backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "background_assets_userId_name_key" ON "background_assets"("userId", "name");

-- CreateIndex
CREATE INDEX "background_assets_userId_createdAt_idx" ON "background_assets"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "curated_backgrounds_isActive_idx" ON "curated_backgrounds"("isActive");

-- AddForeignKey
ALTER TABLE "background_assets" ADD CONSTRAINT "background_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Rollback Strategy

```prisma
-- Drop tables (in reverse order of creation)
DROP TABLE "background_assets";
DROP TABLE "curated_backgrounds";
```

**Data Loss**: None (new feature, no existing data)

---

## Validation Rules

### BackgroundAsset

| Field      | Rule                                      | Enforced By       |
|------------|-------------------------------------------|-------------------|
| name       | Non-empty, sanitized filename             | Application       |
| name       | Unique per userId                         | DB constraint     |
| imagePath  | Must exist in Supabase Storage            | Application       |
| fileSize   | > 0 and <= 5MB (5242880 bytes)            | Application       |
| dimensions | Optional, if present: { width, height }   | Application/Type  |

### CuratedBackground

| Field      | Rule                                      | Enforced By       |
|------------|-------------------------------------------|-------------------|
| name       | Non-empty, human-readable                 | Application       |
| imagePath  | Must exist in curated-backgrounds bucket  | Application       |
| tags       | Array of strings (can be empty)           | Prisma type       |
| isActive   | Boolean (default true)                    | Prisma default    |

---

## Storage Integration

### Supabase Buckets

**user-backgrounds** (private):
```
user-backgrounds/
├── {userId1}/
│   ├── backgrounds/
│   │   ├── sunset-gradient.png
│   │   ├── abstract-waves.jpg
│   │   └── ...
├── {userId2}/
│   └── backgrounds/
│       └── ...
```

**curated-backgrounds** (public):
```
curated-backgrounds/
├── bg-gradient-01.png
├── bg-gradient-02.png
├── bg-abstract-03.jpg
└── ...
```

### Path Mapping

| Model              | imagePath Example                                    | Bucket              |
|--------------------|------------------------------------------------------|---------------------|
| BackgroundAsset    | `{userId}/backgrounds/sunset-gradient.png`           | user-backgrounds    |
| CuratedBackground  | `bg-gradient-01.png`                                 | curated-backgrounds |

---

## Type Definitions

### TypeScript Types

```typescript
// apps/app/src/domain/background/types.ts

export type BackgroundAsset = {
  id: string;
  userId: string;
  name: string;
  imagePath: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  createdAt: string;  // ISO date string
  signedUrl?: string;  // Computed on fetch
};

export type CuratedBackground = {
  id: string;
  name: string;
  imagePath: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  publicUrl?: string;  // Computed on fetch
};

export type BackgroundSource = 'user' | 'curated';

export type BackgroundListResponse = {
  user: BackgroundAsset[];
  curated: CuratedBackground[];
};
```

---

## Performance Considerations

### Query Optimization

1. **Indexes**:
   - `background_assets_userId_createdAt_idx`: Speeds up user background list (O(log n))
   - `background_assets_userId_name_key`: Ensures filename uniqueness (O(log n))
   - `curated_backgrounds_isActive_idx`: Speeds up active backgrounds query (O(log n))

2. **Lazy Loading**:
   - Fetch backgrounds only when selector is opened (not on page load)
   - Generate signed URLs on-demand (1-hour TTL)

3. **Batch Queries**:
   - Fetch all user backgrounds in single query (avoid N+1)
   - Fetch all curated backgrounds in single query

### Storage Optimization

1. **CDN**: Curated backgrounds use public bucket → cached by CDN
2. **Signed URLs**: User backgrounds use 1-hour signed URLs → re-fetch on expiry
3. **File Size Limit**: 5MB max prevents storage bloat

---

## Testing Considerations

### Unit Tests (Vitest)

1. Test unique constraint enforcement:
   ```typescript
   test('should reject duplicate filename', async () => {
     await createBackground({ userId: '1', name: 'test.png' });
     await expect(
       createBackground({ userId: '1', name: 'test.png' })
     ).rejects.toThrow('P2002');
   });
   ```

2. Test cascade delete:
   ```typescript
   test('should delete backgrounds when user deleted', async () => {
     await createUser({ id: '1' });
     await createBackground({ userId: '1', name: 'test.png' });
     await deleteUser({ id: '1' });
     const backgrounds = await getBackgrounds({ userId: '1' });
     expect(backgrounds).toHaveLength(0);
   });
   ```

### Integration Tests (Playwright)

1. Test upload → persist → logout → login flow
2. Test duplicate filename error handling
3. Test background deletion with confirmation

---

## Security Considerations

### Row-Level Security (RLS)

Enforced via Data Access Layer (DAL):
- `getUserDb(userId)` automatically scopes queries to userId
- No manual filtering needed in application code

### Input Sanitization

- Filenames sanitized before storage (remove `../`, special chars)
- File size validated before upload
- MIME type validated (PNG, JPG, WEBP, SVG only)

### Cascade Deletes

- User deletion → cascades to backgrounds (prevents orphaned records)
- Background deletion → manually removes from Storage (prevents orphaned files)

---

## Future Enhancements

### Post-MVP

1. **Background tags**: Enable filtering by color scheme, style, etc.
2. **Background dimensions**: Store actual dimensions for responsive handling
3. **Thumbnail paths**: Store separate thumbnail URLs for faster loading
4. **Usage tracking**: Track which backgrounds are most popular
5. **Soft delete**: Add `deletedAt` field for recovery (if needed)

---

## Summary

**New Tables**: 2 (`BackgroundAsset`, `CuratedBackground`)
**Modified Tables**: 1 (`User` - add relation)
**Indexes**: 3 (2 on BackgroundAsset, 1 on CuratedBackground)
**Storage Buckets**: 2 (`user-backgrounds`, `curated-backgrounds`)

**Migration Command**:
```bash
npx prisma migrate dev --name add-background-models
```

**Seed Command** (after manual Supabase upload):
```bash
npx prisma db seed
```

---

**Data Model Completed**: 2025-12-21
