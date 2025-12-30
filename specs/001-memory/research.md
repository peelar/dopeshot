# Research: DopeShot Memory

**Feature Branch**: `001-memory`
**Date**: 2025-12-29

## Technical Context Findings

### Stack Confirmation

| Aspect | Finding |
|--------|---------|
| Framework | Next.js 16.1.1 + React 19.2.1 |
| Language | TypeScript 5.6.3 (strict mode) |
| State Management | Jotai 2.15.2 |
| Authentication | better-auth 1.4.7 with Prisma adapter |
| Database | PostgreSQL via Prisma 7.2.0 |
| Storage | Supabase Storage (@supabase/supabase-js 2.88.0) |
| UI | shadcn/ui + Radix UI + Tailwind 4.0 |
| Export | html-to-image 1.11.13 |
| Analytics | Simple Analytics via `track()` |
| Testing | Vitest + Playwright |

### Existing Infrastructure

#### Authentication (better-auth)
- **Location**: `src/lib/auth/auth-server.ts`, `src/lib/auth/auth-client.ts`
- Magic link enabled via Resend
- Auto-creates `BrandProfile` and `UserMetadata` on signup
- Session caching with 5-minute TTL
- Client-side: `useSession()` hook available

#### Database Tables (Prisma)
- `User` - better-auth user
- `BrandProfile` - brand settings per user
- `UserMetadata` - subscription tier, export limits
- `GeneratedAsset` - **already exists** with fields: userId, imagePath, layout, style, settings (JSON), metadata (JSON), textOverlays (JSON)
- `PersonalBackground` - user-uploaded backgrounds

#### Storage (Supabase)
- **Existing buckets**: `personal_backgrounds`
- **Admin client**: `src/lib/supabase-admin.ts` with service role key
- Signed URLs with 3600s TTL pattern established

#### State Management (Jotai)
- **Location**: `src/hooks/atoms.ts`, `src/hooks/atoms/derived.ts`
- Key atoms: `configAtom`, `assetsAtom`, `orientationAtom`, `screenshotGradientAtom`
- atomWithStorage pattern for persistence

#### Export Flow
- **Location**: `src/domain/layout/export.ts`, `src/hooks/use-playground-controller.ts`
- `exportLayoutAsPng()` renders hidden container and downloads
- Tracks `export_button_clicked` event
- Export dimensions: 1920x1080 (desktop), 1080x1920 (mobile)

#### Editor Layout
- **Location**: `src/app/(playground)/_components/`
- Two-column layout: left (content/canvas), right (sidebar)
- Sidebar tabs: Design, Brand
- Mobile: drawer pattern
- Header: upload/export buttons

#### Gradient System
- **Location**: `src/domain/layout/gradients/`
- `AdvancedGradient` type with multiple stops
- `screenshotGradientAtom` persists derived gradient
- Strategies: hero-base, multi-color, complementary, analogous, triadic

---

## Research Questions & Decisions

### 1. Screenshot Storage Strategy

**Decision**: Upload screenshots to Supabase Storage in a new `memory-screenshots` bucket

**Rationale**:
- Existing pattern: `personal_backgrounds` bucket already handles user uploads
- `supabase-admin.ts` already has service role for privileged operations
- Signed URLs pattern (3600s TTL) works for authenticated access
- Path structure: `{userId}/{memoryItemId}.png`

**Alternatives Considered**:
- Store base64 in database → Rejected (too large, slow queries)
- Reference client-side only → Rejected (can't reproduce across devices)
- Store rendered image → Rejected (wastes storage, config is smaller)

### 2. Memory Item Data Model

**Decision**: Extend existing `GeneratedAsset` table or create new `MemoryItem` table

**Rationale**:
- `GeneratedAsset` already has: userId, imagePath, layout, style, settings (JSON), metadata (JSON)
- Missing: share hash, share status, config hash for deduplication
- **Recommend new `MemoryItem` table** to avoid polluting existing data and allow clean migration

**Schema Addition**:
```
MemoryItem
  - id: UUID (primary key)
  - userId: UUID (FK to User)
  - configHash: String (for deduplication)
  - screenshotPath: String (Supabase storage path)
  - configuration: JSON (full export config)
  - shareHash: String? (nullable, 12+ chars)
  - sharedAt: DateTime? (nullable)
  - createdAt: DateTime
```

### 3. Sidebar Placement

**Decision**: Add collapsible left sidebar, separate from existing right sidebar

**Rationale**:
- Right sidebar is reserved for Design/Brand tabs (per constitution)
- Left side is empty in current layout
- ChatGPT-style pattern suggests left sidebar for history/memory
- Can be collapsed to icon-only state

**Implementation**:
- New component: `MemorySidebar`
- State: `memorySidebarOpenAtom` (Jotai)
- Trigger: Icon in left rail area

### 4. Export Configuration Structure

**Decision**: Serialize current editor state into JSON configuration

**Configuration Schema**:
```typescript
interface MemoryConfiguration {
  version: 1;
  layoutId: string;
  variant: string;
  orientation: "desktop" | "mobile";
  screenshotPath: string;
  gradient: {
    type: string;
    colors: string[];
    angle?: number;
    positions?: number[];
  };
  textOverlays: {
    [key: string]: string;
  };
  config: {
    fontSize: string;
    fontFamily: string;
    // ... other LayoutConfig fields
  };
  renderingFlags: {
    aspectLocked: boolean;
    screenshotZoom: number;
  };
}
```

### 5. Thumbnail Generation

**Decision**: Re-render from stored config on-demand

**Rationale**:
- Avoids storing duplicate images
- Config is source of truth
- Can be cached client-side
- Allows layout updates to reflect in thumbnails

**Implementation**:
- Use same rendering pipeline as main preview
- Scale down for thumbnail size (e.g., 200px width)
- Lazy load thumbnails as sidebar scrolls

### 6. Share Hash Generation

**Decision**: Use `nanoid` with custom alphabet, 12 characters

**Rationale**:
- Already used in the ecosystem (common choice)
- 12 chars with URL-safe alphabet = ~10^21 combinations
- Collision probability negligible at expected scale
- Short, elegant URLs: `/abc123xyz789`

**Implementation**:
```typescript
import { nanoid } from 'nanoid';
const shareHash = nanoid(12);
```

### 7. Post-Export Button State

**Decision**: Use Jotai atom to track nudge state, dismiss on any atom change

**Rationale**:
- Fits existing state management pattern
- "Any interaction" = subscription to relevant atoms
- Simple timeout fallback (30s) as safety

**Implementation**:
```typescript
const showExportNudgeAtom = atom(false);
// Set true after export (if logged out)
// Set false on: any config change, any asset change, sidebar open, etc.
```

### 8. Public URL Route

**Decision**: Dynamic route at `app/[shareHash]/page.tsx`

**Rationale**:
- Clean URL: `dopeshot.app/abc123xyz789`
- Next.js catch-all for unknown hashes returns 404
- Server component fetches config, client renders

**Implementation**:
- Check if shareHash exists and is shared
- If shared: render preview + load config into editor
- If not shared: return 404

### 9. Configuration Hash for Deduplication

**Decision**: SHA-256 hash of normalized JSON config

**Rationale**:
- Deterministic: same config = same hash
- Fast to compute
- Stored in database for quick lookup

**Implementation**:
```typescript
import { createHash } from 'crypto';
const normalized = JSON.stringify(sortKeys(config));
const configHash = createHash('sha256').update(normalized).digest('hex').slice(0, 32);
```

### 10. Context Menu Implementation

**Decision**: Use Radix UI Context Menu (already in shadcn/ui)

**Rationale**:
- Consistent with existing UI patterns
- Accessible by default
- Right-click native behavior

**Implementation**:
```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <MemoryItem />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem disabled={isShared}>Share</ContextMenuItem>
    <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## Dependencies to Add

| Package | Purpose | Version |
|---------|---------|---------|
| `nanoid` | Share hash generation | ^5.0.0 |

**No new packages needed** - most functionality covered by existing deps.

---

## Performance Considerations

### Thumbnail Rendering
- Virtualize sidebar list for 50+ items
- Lazy render thumbnails outside viewport
- Consider thumbnail caching in IndexedDB

### Export + Persist Flow
- Screenshot upload can happen in parallel with image download
- Use optimistic UI: show memory item immediately, sync in background
- Retry logic for failed uploads

### Share URL Loading
- Server-side fetch of config
- Static generation not possible (dynamic data)
- Edge caching for popular shared items (future optimization)

---

## Security Considerations

### Storage Access
- Screenshots in private bucket, signed URLs only
- RLS: users can only access their own items
- Service role for share URL generation

### Share URLs
- Unguessable: 12-char random hash
- No enumeration: only exact match works
- Delete invalidates URL immediately

### Configuration Validation
- Validate config structure on load
- Sanitize text overlays (XSS prevention)
- Limit config size (prevent abuse)

---

## Migration Path

### Database
1. Create `MemoryItem` table via Prisma migration
2. Create `memory-screenshots` Supabase bucket
3. Set up RLS policies

### Code
1. Add memory-related atoms
2. Create MemorySidebar component
3. Extend export flow to persist
4. Add share URL route
5. Implement context menu actions

### Rollout
- Feature flag: `memory_enabled`
- Gradual rollout to logged-in users
- Monitor storage usage and performance
