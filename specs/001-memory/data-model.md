# Data Model: DopeShot Memory

**Feature Branch**: `001-memory`
**Date**: 2025-12-29

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │   MemoryItem    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──1:N──│ id (PK)         │
│ email           │       │ userId (FK)     │
│ name            │       │ configHash      │
│ ...             │       │ screenshotPath  │
└─────────────────┘       │ configuration   │
                          │ shareHash       │
                          │ sharedAt        │
                          │ createdAt       │
                          └─────────────────┘
```

## Entities

### MemoryItem

A persisted export record representing a user's saved design configuration.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `userId` | UUID | FK → User, NOT NULL | Owner of the memory item |
| `configHash` | String(32) | NOT NULL, indexed | SHA-256 hash (first 32 chars) for deduplication |
| `screenshotPath` | String | NOT NULL | Supabase storage path: `{userId}/{id}.png` |
| `configuration` | JSON | NOT NULL | Full export configuration (see schema below) |
| `shareHash` | String(12) | UNIQUE, nullable | Nanoid for public URL, null if not shared |
| `sharedAt` | DateTime | nullable | When share was created |
| `createdAt` | DateTime | NOT NULL, default now() | When memory item was created |

**Indexes**:
- `userId` (for fetching user's memory items)
- `userId, createdAt DESC` (for ordered listing)
- `shareHash` (for public URL lookup)
- `userId, configHash` (for deduplication check)

**Constraints**:
- Cascade delete when User is deleted
- `shareHash` must be unique across all items (if not null)

### Configuration JSON Schema

```typescript
interface MemoryConfiguration {
  // Schema version for future migrations
  version: 1;

  // Layout identification
  layoutId: string;
  variant: string;
  orientation: "desktop" | "mobile";

  // Screenshot reference (relative path in Supabase storage)
  screenshotPath: string;

  // Frozen gradient parameters
  gradient: {
    type: "linear" | "radial" | "mesh";
    colors: string[];           // Hex colors
    angle?: number;             // For linear gradients
    positions?: number[];       // Stop positions
    meshLayers?: MeshLayer[];   // For mesh gradients
  };

  // Text overlay values
  textOverlays: Record<string, string>;

  // Layout configuration snapshot
  config: {
    fontSize: string;
    fontFamily: string;
    textColor: string;
    backgroundColor: string;
    padding: number;
    borderRadius: number;
    shadow: string;
    // Additional layout-specific settings
    [key: string]: unknown;
  };

  // Rendering state
  renderingFlags: {
    aspectLocked: boolean;
    screenshotZoom: number;
  };
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `configHash` | Exactly 32 hex characters |
| `screenshotPath` | Must match pattern `{uuid}/{uuid}.png` |
| `shareHash` | If present: exactly 12 URL-safe characters |
| `configuration.version` | Must equal current schema version (1) |
| `configuration.screenshotPath` | Must match `screenshotPath` field |
| `configuration.gradient.colors` | Array of 2-6 valid hex colors |

### State Transitions

```
                    ┌─────────────┐
                    │   Created   │
                    │  (private)  │
                    └──────┬──────┘
                           │
                      Share action
                           │
                           ▼
                    ┌─────────────┐
                    │   Shared    │
                    │  (public)   │
                    └──────┬──────┘
                           │
                      Delete action
                           │
                           ▼
                    ┌─────────────┐
                    │   Deleted   │
                    │  (removed)  │
                    └─────────────┘
```

**Notes**:
- No un-share action: delete is the only way to remove public access
- Shared items show disabled "Share" in context menu
- Delete removes both database record and storage file

---

## Supabase Storage

### Bucket: `memory-screenshots`

| Property | Value |
|----------|-------|
| Name | `memory-screenshots` |
| Public | No (private) |
| File size limit | 10 MB |
| Allowed MIME types | `image/png`, `image/jpeg` |

### Path Structure

```
memory-screenshots/
└── {userId}/
    ├── {memoryItemId-1}.png
    ├── {memoryItemId-2}.png
    └── ...
```

### Access Patterns

| Operation | Who | How |
|-----------|-----|-----|
| Upload | Authenticated user | Via API route with service role |
| Read (owner) | Authenticated user | Signed URL (3600s TTL) |
| Read (shared) | Anyone | Public signed URL via share route |
| Delete | Authenticated user | Via API route with service role |

### RLS Policies

```sql
-- Users can only see their own screenshots
CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'memory-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Service role handles all writes (via API routes)
-- No direct user insert/update/delete policies needed
```

---

## Prisma Schema Addition

```prisma
model MemoryItem {
  id              String    @id @default(uuid())
  userId          String
  configHash      String    @db.VarChar(32)
  screenshotPath  String
  configuration   Json
  shareHash       String?   @unique @db.VarChar(12)
  sharedAt        DateTime?
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, configHash])
}
```

---

## Client-Side State (Jotai)

### New Atoms

```typescript
// Memory sidebar visibility
const memorySidebarOpenAtom = atom(false);

// Cached memory items (fetched from server)
const memoryItemsAtom = atom<MemoryItem[]>([]);

// Loading state
const memoryLoadingAtom = atom(false);

// Post-export nudge visibility
const showExportNudgeAtom = atom(false);

// Currently loaded memory item (if editing from memory)
const loadedMemoryItemIdAtom = atom<string | null>(null);
```

### Derived Atoms

```typescript
// Check if current config matches a memory item (for deduplication)
const currentConfigHashAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  const gradient = get(screenshotGradientAtom);
  // ... compute hash
  return computeConfigHash({ config, assets, gradient });
});

// Check if current config exists in memory
const configExistsInMemoryAtom = atom((get) => {
  const hash = get(currentConfigHashAtom);
  const items = get(memoryItemsAtom);
  return items.some(item => item.configHash === hash);
});
```

---

## API Data Transfer Objects

### MemoryItemDTO (Response)

```typescript
interface MemoryItemDTO {
  id: string;
  screenshotUrl: string;  // Signed URL for thumbnail
  isShared: boolean;
  shareUrl: string | null;
  createdAt: string;      // ISO 8601
}
```

### CreateMemoryItemRequest

```typescript
interface CreateMemoryItemRequest {
  configHash: string;
  configuration: MemoryConfiguration;
  screenshot: File;       // Multipart upload
}
```

### ShareMemoryItemRequest

```typescript
interface ShareMemoryItemRequest {
  memoryItemId: string;
}
```

### ShareMemoryItemResponse

```typescript
interface ShareMemoryItemResponse {
  shareUrl: string;       // Full URL: https://dopeshot.app/abc123xyz789
}
```

---

## Migration Checklist

- [ ] Create Prisma migration for `MemoryItem` table
- [ ] Create `memory-screenshots` Supabase bucket
- [ ] Set up RLS policies on bucket
- [ ] Add relation to User model in Prisma schema
- [ ] Run `npx prisma generate` to update client
- [ ] Seed test data for development
