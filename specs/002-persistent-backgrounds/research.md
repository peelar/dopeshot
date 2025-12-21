# Technical Research: Persistent Background Management

**Feature**: 002-persistent-backgrounds
**Date**: 2025-12-21
**Status**: Completed

## Research Summary

This document consolidates technical decisions for implementing persistent background management. All research follows the principle of reusing existing patterns from the logo upload implementation while making minimal architectural changes.

---

## Decision 1: Curated Background Storage Strategy

**Decision**: Store curated backgrounds in both Prisma DB (metadata) and Supabase Storage (files)

**Rationale**:
- **Metadata in DB**: Enables filtering, sorting, and admin management of curated backgrounds
- **Files in Storage**: Leverages Supabase's CDN, signed URLs, and image transformation
- **Consistency**: Mirrors the approach used for user logos (`BrandProfile.logoPath` + Storage)
- **Query efficiency**: Can fetch all curated backgrounds with single DB query, then load images lazily

**Implementation**:
```prisma
model CuratedBackground {
  id          String   @id @default(cuid())
  name        String
  imagePath   String   // Supabase Storage path: curated-backgrounds/{filename}
  tags        String[] // For future categorization
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  @@index([isActive])
}
```

**Storage bucket**: `curated-backgrounds` (public read access)

**Admin interface**: Manual upload via Supabase dashboard for MVP, can add admin panel later

**Alternatives Considered**:
- **Storage-only**: Rejected - no way to query/filter without DB metadata
- **DB-only with base64**: Rejected - bloats DB, no CDN benefits
- **Hardcoded URLs**: Rejected - inflexible, requires code deploy to add backgrounds

---

## Decision 2: Background Asset Table Design

**Decision**: Create separate `BackgroundAsset` table (don't extend `GeneratedAsset`)

**Rationale**:
- **Semantic clarity**: `GeneratedAsset` represents *exported* screenshots, not uploaded backgrounds
- **Different lifecycle**: Backgrounds persist indefinitely; generated assets might have retention policies
- **Query performance**: Dedicated table avoids type filtering on `GeneratedAsset.kind`
- **Future flexibility**: Can add background-specific fields (dimensions, thumbnail path, tags) without cluttering `GeneratedAsset`

**Implementation**:
```prisma
model BackgroundAsset {
  id          String   @id @default(cuid())
  userId      String
  name        String   // Original filename
  imagePath   String   // Supabase Storage path: user-backgrounds/{userId}/{filename}
  fileSize    Int      // Bytes
  dimensions  Json?    // { width: number, height: number }
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, name])  // Enforce unique filenames per user
  @@index([userId, createdAt])
}
```

**Alternatives Considered**:
- **Extend `GeneratedAsset`**: Rejected - semantically incorrect, complex queries
- **Single `Asset` table**: Rejected - mixing concerns, degrades over time

---

## Decision 3: Filename Uniqueness Enforcement

**Decision**: Enforce uniqueness at DB level with unique constraint `@@unique([userId, name])`

**Rationale**:
- **Atomic guarantee**: DB constraint prevents race conditions
- **Clear errors**: Prisma will throw `PrismaClientKnownRequestError` with `code: 'P2002'`
- **Simple implementation**: No need for separate existence check queries
- **Storage alignment**: Supabase Storage paths also include filename, so uniqueness prevents overwrites

**Implementation**:
```typescript
// apps/app/src/app/api/background/upload/route.ts
try {
  await db.backgroundAsset.create({
    data: { userId, name: sanitizedFilename, imagePath, fileSize }
  });
} catch (error) {
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: `A background named "${sanitizedFilename}" already exists. Please rename and try again.` },
      { status: 409 }
    );
  }
  throw error;
}
```

**Alternatives Considered**:
- **Application-level check**: Rejected - race conditions possible
- **Storage-level check**: Rejected - Supabase Storage doesn't provide atomic uniqueness API
- **Auto-versioning**: Rejected - user explicitly chose "no duplication logic" in spec clarification

---

## Decision 4: Curated Background Seeding

**Decision**: Manual upload via Supabase dashboard for MVP, document process in quickstart.md

**Rationale**:
- **Simplicity**: No seed script complexity for binary files
- **Design iteration**: Easier to swap backgrounds during early testing
- **One-time setup**: Only needed once per environment (dev, prod)
- **Clear process**: Document exact steps for reproducibility

**Process** (documented in quickstart.md):
1. Design/acquire 10 high-quality background images (1920x1080 minimum)
2. Upload to Supabase Storage bucket `curated-backgrounds/` via dashboard
3. Note file paths (e.g., `bg-gradient-01.png`)
4. Run Prisma seed script to insert DB records:

```typescript
// prisma/seed-curated-backgrounds.ts
const curatedBackgrounds = [
  { name: "Gradient Sunset", imagePath: "bg-gradient-01.png" },
  { name: "Abstract Waves", imagePath: "bg-gradient-02.png" },
  // ... 8 more
];

for (const bg of curatedBackgrounds) {
  await prisma.curatedBackground.create({ data: bg });
}
```

**Alternatives Considered**:
- **Automated seed with bundled images**: Rejected - bloats git repo with binary files
- **Fetch from external CDN**: Rejected - external dependency, no ownership
- **Generate programmatically**: Rejected - design quality matters for user perception

---

## Decision 5: Background Deletion Strategy

**Decision**: Hard delete (remove from both DB and Storage)

**Rationale**:
- **User expectation**: Deleted means gone (matches logo deletion behavior)
- **Storage costs**: Avoid accumulating unused files
- **Simplicity**: No soft-delete logic or cleanup jobs needed
- **Safety**: Confirmation dialog prevents accidental deletions (per spec FR-013)

**Implementation**:
```typescript
// apps/app/src/app/api/background/delete/route.ts
const background = await db.backgroundAsset.findUnique({
  where: { id: backgroundId, userId }  // Ensures user owns it
});

if (!background) {
  return NextResponse.json({ error: "Background not found" }, { status: 404 });
}

// Delete from Storage first (idempotent)
await supabaseAdmin.storage
  .from('user-backgrounds')
  .remove([background.imagePath]);

// Then delete from DB
await db.backgroundAsset.delete({ where: { id: backgroundId } });
```

**Edge case**: If background is currently applied to canvas, deletion succeeds but canvas shows placeholder. User can select new background.

**Alternatives Considered**:
- **Soft delete with `isActive` flag**: Rejected - adds complexity, wastes storage
- **Prevent deletion if in use**: Rejected - UX friction, user wants control
- **Archive to separate bucket**: Rejected - over-engineering for MVP

---

## Decision 6: Supabase Storage Bucket Organization

**Decision**: Use separate buckets for different access patterns

**Buckets**:
1. **`user-backgrounds`** (private)
   - Path: `{userId}/backgrounds/{filename}`
   - Access: Owner only (RLS enforced)
   - Signed URLs: 1 hour expiry

2. **`curated-backgrounds`** (public)
   - Path: `{filename}` (flat structure, no user folders)
   - Access: Public read
   - No signed URLs needed (direct CDN links)

**Rationale**:
- **Security**: User backgrounds are private by default
- **Performance**: Curated backgrounds can use CDN without signed URL overhead
- **Clarity**: Bucket name indicates purpose and access model
- **RLS simplicity**: Don't mix public and private assets in same bucket

**Implementation**:
```sql
-- Supabase Storage RLS for user-backgrounds bucket
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Users can read their own backgrounds"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()
);
```

**Alternatives Considered**:
- **Reuse `generated-assets` bucket**: Rejected - different access patterns, mixing concerns
- **Single bucket with RLS**: Rejected - complex policies for public vs. private
- **No RLS, application-only checks**: Rejected - security risk

---

## Decision 7: Jotai State Management

**Decision**: Create separate atoms for user and curated backgrounds, reuse existing derived atom pattern

**Atoms**:
```typescript
// apps/app/src/hooks/atoms.ts

// User-uploaded backgrounds (persisted to DB)
export const userBackgroundsAtom = atom<BackgroundAsset[]>([]);

// Curated backgrounds (shared across all users)
export const curatedBackgroundsAtom = atom<CuratedBackground[]>([]);

// Derived: all available backgrounds for selector
export const availableBackgroundsAtom = atom((get) => {
  const userBgs = get(userBackgroundsAtom);
  const curatedBgs = get(curatedBackgroundsAtom);
  return { user: userBgs, curated: curatedBgs };
});
```

**Rationale**:
- **Separation**: User vs. curated backgrounds have different sources and lifecycles
- **Derived atom**: Follows existing pattern (see `backgroundAssetAtom` in atoms/derived.ts)
- **No localStorage**: User's selected background is already in `configAtom.assets.background`
- **Optimistic updates**: Update atom immediately on upload, rollback on error

**Sync Strategy**:
1. On upload: Optimistically add to `userBackgroundsAtom` → POST API → on success, update with server data
2. On delete: Optimistically remove → DELETE API → on error, restore from backup
3. On page load: Fetch both user and curated backgrounds once

**Alternatives Considered**:
- **Single `backgroundsAtom` with mixed array**: Rejected - hard to filter, unclear ownership
- **Store in localStorage**: Rejected - data is in DB, no need to duplicate
- **React Query for caching**: Rejected - adds dependency, Jotai sufficient for simple state

---

## Decision 8: Image Thumbnail Strategy

**Decision**: No thumbnail generation for MVP - use original images with CSS sizing

**Rationale**:
- **Simplicity**: Avoids thumbnail generation complexity
- **Performance**: Background images are already <5MB, modern browsers handle well
- **CSS optimization**: Use `background-size: cover` with fixed 200x200px containers
- **Lazy loading**: Can add `loading="lazy"` to img tags in selector
- **Future enhancement**: Can add Supabase Image Transformation later if needed

**Implementation**:
```tsx
// Background selector grid
<div className="grid grid-cols-3 gap-2">
  {backgrounds.map(bg => (
    <div
      key={bg.id}
      className="w-24 h-24 rounded-md bg-cover bg-center cursor-pointer"
      style={{ backgroundImage: `url(${bg.signedUrl})` }}
      onClick={() => selectBackground(bg.id)}
    />
  ))}
</div>
```

**Performance target**: <1s load time for 10 curated + N user backgrounds

**Alternatives Considered**:
- **Client-side resize**: Rejected - extra processing, delays upload
- **Supabase Image Transformation**: Rejected - adds API calls, complexity for MVP
- **Pre-generated thumbnails**: Rejected - storage overhead, extra upload step

---

## Best Practices Summary

### Supabase Storage Patterns
- **Bucket structure**: Separate buckets by access pattern (private vs. public)
- **Path structure**: Nest user assets under `{userId}/` for RLS enforcement
- **Signed URLs**: 1-hour expiry, refresh on demand
- **Error handling**: Check Storage errors before DB operations

### Jotai State Management
- **Atom composition**: Separate concerns (user vs. curated backgrounds)
- **Derived atoms**: Compute combined views reactively
- **Optimistic updates**: Update UI immediately, rollback on error
- **Sync on mount**: Fetch backgrounds once, cache in atoms

### Performance Optimization
- **Lazy load selector**: Only fetch backgrounds when user opens selector
- **CDN leverage**: Use public bucket for curated backgrounds
- **Batch queries**: Fetch all user backgrounds in single query with `findMany`
- **Image formats**: Support WebP for smaller file sizes

---

## Open Questions & Future Enhancements

### Deferred to Post-MVP

1. **Background tags/categories**: Could add filtering in selector later
2. **Background previews**: Could show background applied to current layout before committing
3. **Batch upload**: Could support uploading multiple backgrounds at once
4. **Background sharing**: Could allow users to share backgrounds (public bucket + unique link)
5. **Thumbnail generation**: Could add if load time exceeds 1s
6. **Admin panel**: Could build UI for managing curated backgrounds

### Monitoring & Metrics

Track these analytics events to inform future decisions:
- `background_upload_failed` (reason: "file_size" | "duplicate" | "network")
- `curated_background_selected_more_than_user` (indicates curated quality)
- `background_selector_opened` (measure engagement)
- `background_deleted_after_X_days` (indicates satisfaction)

---

## References

- Existing logo upload: `apps/app/src/app/api/brand/upload-logo/route.ts`
- Supabase Storage docs: https://supabase.com/docs/guides/storage
- Prisma unique constraints: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#unique-constraints
- Jotai derived atoms: https://jotai.org/docs/core/atom#derived-atoms

**Research Completed**: 2025-12-21
