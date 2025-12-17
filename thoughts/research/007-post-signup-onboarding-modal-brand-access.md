# Research: Post-Signup Onboarding Modal + Brand Access (v1)

## Overview

This research document provides comprehensive findings for implementing a post-signup onboarding modal and persistent brand access panel in dopeshot. The feature will collect an optional brand logo immediately after signup/login and provide ongoing access to brand settings through a persistent "Brand" entry point in the builder.

## Objectives

1. **Onboarding Modal**: Collect one optional brand signal (logo) immediately after first authenticated session
2. **Brand Panel**: Provide persistent access to brand configuration (logo management) without interrupting core flow
3. **Persistence**: Store brand data in Supabase `brand_profiles` table
4. **Analytics**: Track all user interactions with defined events

---

## Key Files & Locations

### Authentication System

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/lib/auth/auth-server.ts` | BetterAuth server setup with PostgreSQL | 1-77 |
| `/lib/auth/auth-client.ts` | Client-side auth with hooks | 1-11 |
| `/lib/auth/provider.tsx` | React Context for auth state | 1-50 |
| `/lib/auth/types.ts` | User, Session, BrandProfile types | 1-35 |
| `/lib/auth/actions.ts` | Server functions for sign in/up/out | 1-120 |
| `/components/auth/auth-form.tsx` | Auth form component (magic link + email/password) | 1-345 |
| `/app/auth/page.tsx` | Dedicated auth page route | 1-86 |

### Modal/Dialog Components

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/components/ui/sheet.tsx` | Radix Dialog-based sheet component | 1-124 |
| `/components/mobile-actions.tsx` | Bottom sheet implementation example | 35-216 |
| `/hooks/use-sidebar-state.ts` | Sidebar state management pattern | 1-163 |

### File Upload System

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/hooks/use-file-upload.ts` | Main file upload hook (validation + processing) | 1-184 |
| `/domain/asset/upload-orchestrator.ts` | File processing logic (metadata extraction) | 1-67 |
| `/domain/asset/types.ts` | Asset type definitions | 1-27 |
| `/hooks/use-drag-and-upload.ts` | Drag/drop UX management | 1-114 |
| `/components/sidebar-sections/logo-section.tsx` | Logo upload dropzone component | 1-160 |

### Builder UI Structure

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/app/page.tsx` | Main builder page (three-column layout) | 38-158 |
| `/components/app-header.tsx` | Sticky top header with actions | 19-77 |
| `/components/playground-workspace.tsx` | Central preview workspace | 45-195 |
| `/components/layout-config.tsx` | Right sidebar accordion panel | 28-152 |

### State Management

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/hooks/atoms.ts` | Core Jotai atoms (config, assets, UI state) | 1-56 |
| `/hooks/atoms/derived.ts` | Derived/computed atoms | 1-69 |

### Analytics

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/lib/analytics.ts` | Track function implementation (Umami) | 26-45 |

### Supabase Integration

| File | Purpose | Key Lines |
|------|---------|-----------|
| `/lib/supabase-db.ts` | Supabase client setup (non-auth) | 1-19 |
| `/supabase/migrations/20240401T000000_init.sql` | Database schema (brand_profiles, user_metadata, generated_assets) | 1-155 |

---

## Architecture & Data Flow

### 1. Authentication Flow

```
User Signs Up/In
    ↓
BetterAuth (lib/auth/auth-server.ts)
    ↓
Database Trigger (supabase/migrations)
    ↓
Auto-create brand_profile + user_metadata records
    ↓
AuthProvider (lib/auth/provider.tsx) updates context
    ↓
useAuth() hook returns { user, session, isAuthenticated }
```

**Key Detection Points:**
- **First session**: Check `isAuthenticated` and `user.createdAt` timestamp
- **Onboarding status**: Query `user_metadata.onboarding_progress` JSONB field
- **Current user**: `const { user, isAuthenticated } = useAuth()`

### 2. Onboarding Modal Trigger Logic

```typescript
// Pseudo-code for modal trigger
const { user, isAuthenticated } = useAuth();
const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

useEffect(() => {
  if (isAuthenticated && user) {
    // Check if onboarding completed in user_metadata
    const onboardingCompleted = /* query user_metadata.onboarding_progress */;
    if (!onboardingCompleted && !hasSeenOnboarding) {
      showOnboardingModal();
    }
  }
}, [isAuthenticated, user]);
```

**Completion States:**
- Upload logo: Mark `onboarding_progress` as `["logo_onboarding_completed"]`
- Skip: Mark `onboarding_progress` as `["logo_onboarding_skipped"]`
- Never show again once any completion state is set

### 3. File Upload Flow

```
User selects/drops file
    ↓
use-drag-and-upload.ts (validation)
    ↓
use-file-upload.ts (handleFileProcess)
    ↓
upload-orchestrator.ts (processFileUpload)
    ↓
Extract metadata (width, height, aspect ratio)
    ↓
Update assetsAtom (Jotai state)
    ↓
Update configAtom with asset reference
    ↓
Track event (track("logo_uploaded", { file_size_kb }))
    ↓
Store in Supabase brand_profiles.logo_path
```

**Accepted File Types:**
- PNG, JPG, WebP, SVG
- Max size: 10MB (from use-file-upload.ts:14)
- No validation of "logo correctness" (per spec)

### 4. Brand Data Persistence

```
Logo Upload
    ↓
Store file in Supabase Storage bucket: brand-logos
    ↓
Path format: {user_id}/logo-{timestamp}.png
    ↓
Update brand_profiles table:
    - logo_path: "brand-logos/{user_id}/logo-{timestamp}.png"
    - updated_at: now()
    ↓
RLS Policy: Only owner can access (user_id = auth.uid())
```

**Database Schema (brand_profiles):**
```sql
create table public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text,
  color_palette jsonb not null default '[]'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Database Schema (user_metadata):**
```sql
create table public.user_metadata (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscription_tier text not null default 'free',
  subscription_status text not null default 'active',
  onboarding_progress jsonb not null default '[]'::jsonb,
  usage jsonb not null default jsonb_build_object('exports_this_month', 0),
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Patterns to Follow

### 1. Modal/Dialog Pattern (Radix Sheet)

**Component Structure:**
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function OnboardingModal({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add your logo (optional)</SheetTitle>
          <SheetDescription>
            This helps DopeShot match your brand automatically.
          </SheetDescription>
        </SheetHeader>
        {/* Upload UI */}
      </SheetContent>
    </Sheet>
  );
}
```

**Key Properties:**
- `side` prop: "top", "bottom", "left", "right" (default: right)
- Overlay: Semi-transparent dark background
- Dismissible: Click outside or ESC to close
- Animation: Slide-in with fade overlay

### 2. File Upload Pattern (Logo)

**Hook Usage (from use-file-upload.ts):**
```tsx
import { useFileUpload } from "@/hooks/use-file-upload";

function LogoUploadSection() {
  const { handleFileProcess, isProcessingUpload } = useFileUpload();

  const onUploadAsset = async (file: File) => {
    await handleFileProcess(file, "logo");
    // Automatically:
    // - Validates file (type, size)
    // - Processes and extracts metadata
    // - Updates assetsAtom
    // - Updates configAtom
    // - Tracks event
  };

  return (
    <AssetDropzone
      onUploadAsset={onUploadAsset}
      isProcessing={isProcessingUpload}
      accept="image/*"
    />
  );
}
```

**Validation Rules (from use-file-upload.ts:25-41):**
```typescript
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ACCEPTED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File, kind: AssetKind): string | null {
  // Check MIME type
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload PNG, JPG, WebP, or SVG";
  }

  // Check extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
    return "Invalid file extension";
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
  }

  return null; // Valid
}
```

### 3. State Management Pattern (Jotai)

**Creating Atoms:**
```typescript
// hooks/atoms/onboarding.ts
import { atom } from "jotai";

export const hasSeenOnboardingAtom = atom<boolean>(false);
export const onboardingModalOpenAtom = atom<boolean>(false);
```

**Using Atoms in Components:**
```typescript
import { useAtom, useAtomValue, useSetAtom } from "jotai";

function OnboardingFlow() {
  // Read + write
  const [modalOpen, setModalOpen] = useAtom(onboardingModalOpenAtom);

  // Read only
  const hasSeen = useAtomValue(hasSeenOnboardingAtom);

  // Write only
  const setHasSeen = useSetAtom(hasSeenOnboardingAtom);
}
```

**Persisted Atoms (localStorage):**
```typescript
import { atomWithStorage } from "jotai/utils";

export const onboardingCompletedAtom = atomWithStorage<boolean>(
  "dopeshot:onboarding_completed",
  false
);
```

### 4. Analytics Pattern

**Track Events (from lib/analytics.ts):**
```typescript
import { track } from "@/lib/analytics";

// On modal shown
track("onboarding_modal_shown");

// On logo uploaded
track("onboarding_logo_uploaded", { file_size_kb: file.size / 1024 });

// On skip
track("onboarding_skipped");

// On completion
track("onboarding_completed", { uploaded_logo: true });

// Brand panel events
track("brand_panel_opened");
track("brand_logo_updated", { file_size_kb: file.size / 1024 });
track("brand_logo_removed");
```

**Event Naming Convention:**
- Format: `snake_case`
- Pattern: `{feature}_{action}`
- Properties: Object with `string | number | boolean` values

### 5. Supabase Query Pattern

**Reading Brand Profile:**
```typescript
import { supabaseDb } from "@/lib/supabase-db";

async function getBrandProfile(userId: string) {
  const { data, error } = await supabaseDb
    .from("brand_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}
```

**Updating Brand Profile:**
```typescript
async function updateBrandLogo(userId: string, logoPath: string) {
  const { error } = await supabaseDb
    .from("brand_profiles")
    .update({ logo_path: logoPath, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw error;
}
```

**Uploading to Storage:**
```typescript
async function uploadLogoToStorage(userId: string, file: File) {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const fileName = `logo-${timestamp}.${extension}`;
  const path = `${userId}/${fileName}`;

  const { data, error } = await supabaseDb.storage
    .from("brand-logos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return path;
}
```

---

## Code Examples

### Example 1: Onboarding Modal Component

```tsx
// components/onboarding/onboarding-modal.tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { supabaseDb } from "@/lib/supabase-db";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { user } = useAuth();
  const { handleFileProcess, isProcessingUpload } = useFileUpload();
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  const handleUpload = async (file: File) => {
    if (!user) return;

    try {
      // Process file locally
      await handleFileProcess(file, "logo");

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const path = `${user.id}/logo-${timestamp}.${extension}`;

      await supabaseDb.storage.from("brand-logos").upload(path, file);

      // Update brand profile
      await supabaseDb
        .from("brand_profiles")
        .update({ logo_path: path })
        .eq("user_id", user.id);

      // Mark onboarding complete
      await supabaseDb
        .from("user_metadata")
        .update({ onboarding_progress: ["logo_onboarding_completed"] })
        .eq("user_id", user.id);

      // Track success
      track("onboarding_logo_uploaded", { file_size_kb: file.size / 1024 });
      track("onboarding_completed", { uploaded_logo: true });

      // Show success message
      setUploadStatus("success");

      // Close modal after brief delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("error");
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      // Mark onboarding skipped
      await supabaseDb
        .from("user_metadata")
        .update({ onboarding_progress: ["logo_onboarding_skipped"] })
        .eq("user_id", user.id);

      track("onboarding_skipped");
      track("onboarding_completed", { uploaded_logo: false });

      onOpenChange(false);
    } catch (error) {
      console.error("Skip failed:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add your logo (optional)</SheetTitle>
          <SheetDescription>
            This helps DopeShot match your brand automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {uploadStatus === "success" ? (
            <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload">
                <Button variant="default" disabled={isProcessingUpload} asChild>
                  <span>Upload logo</span>
                </Button>
              </label>

              <Button variant="secondary" onClick={handleSkip} disabled={isProcessingUpload}>
                Skip for now
              </Button>
            </>
          )}

          {uploadStatus === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Upload failed. Please try again.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Location**: Create at `/components/onboarding/onboarding-modal.tsx`

### Example 2: Onboarding Flow Controller

```tsx
// hooks/use-onboarding-flow.ts
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabaseDb } from "@/lib/supabase-db";
import { track } from "@/lib/analytics";

export function useOnboardingFlow() {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!isAuthenticated || !user) {
        setIsChecking(false);
        return;
      }

      try {
        // Query user_metadata to check onboarding progress
        const { data, error } = await supabaseDb
          .from("user_metadata")
          .select("onboarding_progress")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        const progress = data?.onboarding_progress || [];
        const hasCompleted = progress.includes("logo_onboarding_completed") ||
                           progress.includes("logo_onboarding_skipped");

        if (!hasCompleted) {
          setShowModal(true);
          track("onboarding_modal_shown");
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkOnboardingStatus();
  }, [isAuthenticated, user]);

  return {
    showOnboardingModal: showModal,
    setShowOnboardingModal: setShowModal,
    isCheckingOnboarding: isChecking,
  };
}
```

**Location**: Create at `/hooks/use-onboarding-flow.ts`

### Example 3: Brand Panel Component

```tsx
// components/brand/brand-panel.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useAuth } from "@/lib/auth";
import { supabaseDb } from "@/lib/supabase-db";
import { track } from "@/lib/analytics";

export function BrandPanel() {
  const { user } = useAuth();
  const { handleFileProcess, isProcessingUpload } = useFileUpload();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBrandProfile() {
      if (!user) return;

      try {
        const { data } = await supabaseDb
          .from("brand_profiles")
          .select("logo_path")
          .eq("user_id", user.id)
          .single();

        if (data?.logo_path) {
          const { data: urlData } = await supabaseDb.storage
            .from("brand-logos")
            .getPublicUrl(data.logo_path);

          setLogoUrl(urlData.publicUrl);
        }
      } catch (error) {
        console.error("Failed to load brand profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBrandProfile();
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!user) return;

    try {
      await handleFileProcess(file, "logo");

      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const path = `${user.id}/logo-${timestamp}.${extension}`;

      await supabaseDb.storage.from("brand-logos").upload(path, file);
      await supabaseDb
        .from("brand_profiles")
        .update({ logo_path: path })
        .eq("user_id", user.id);

      const { data: urlData } = await supabaseDb.storage
        .from("brand-logos")
        .getPublicUrl(path);

      setLogoUrl(urlData.publicUrl);
      track("brand_logo_updated", { file_size_kb: file.size / 1024 });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleRemove = async () => {
    if (!user || !logoUrl) return;

    try {
      const { data } = await supabaseDb
        .from("brand_profiles")
        .select("logo_path")
        .eq("user_id", user.id)
        .single();

      if (data?.logo_path) {
        await supabaseDb.storage.from("brand-logos").remove([data.logo_path]);
      }

      await supabaseDb
        .from("brand_profiles")
        .update({ logo_path: null })
        .eq("user_id", user.id);

      setLogoUrl(null);
      track("brand_logo_removed");
    } catch (error) {
      console.error("Remove failed:", error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold">Logo</h3>

      {logoUrl ? (
        <div className="space-y-2">
          <div className="aspect-video w-full rounded-lg border overflow-hidden bg-muted">
            <img src={logoUrl} alt="Brand logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              className="hidden"
              id="logo-replace"
            />
            <label htmlFor="logo-replace" className="flex-1">
              <Button variant="secondary" size="sm" disabled={isProcessingUpload} asChild>
                <span>Replace</span>
              </Button>
            </label>
            <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isProcessingUpload}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="hidden"
            id="logo-add"
          />
          <label htmlFor="logo-add">
            <Button variant="default" size="sm" disabled={isProcessingUpload} asChild>
              <span>Add logo</span>
            </Button>
          </label>
        </>
      )}
    </div>
  );
}
```

**Location**: Create at `/components/brand/brand-panel.tsx`

---

## Recommendations

### Implementation Order

1. **Phase 1: Database Setup** ✅ (Already complete via Supabase migration)
   - `brand_profiles` table exists
   - `user_metadata` table exists
   - Storage buckets configured
   - RLS policies in place

2. **Phase 2: Onboarding Modal**
   - Create `OnboardingModal` component (`/components/onboarding/onboarding-modal.tsx`)
   - Create `useOnboardingFlow` hook (`/hooks/use-onboarding-flow.ts`)
   - Integrate into main builder page (`/app/page.tsx`)
   - Add tracking events
   - Test: Sign up → Modal appears → Upload/Skip → Modal closes → Never appears again

3. **Phase 3: Brand Panel**
   - Create `BrandPanel` component (`/components/brand/brand-panel.tsx`)
   - Add "Brand" entry point to `AppHeader` (`/components/app-header.tsx`)
   - Use Sheet for panel presentation (similar to mobile bottom sheet)
   - Add tracking events
   - Test: Click Brand → Panel opens → Upload/Replace/Remove → Changes persist

4. **Phase 4: Integration Testing**
   - Verify logo appears in generated outputs
   - Test cross-session persistence
   - Verify RLS policies (can't access other users' logos)
   - Test error handling (upload failures, network issues)

### UI Integration Points

**AppHeader Addition (`/components/app-header.tsx:45-73`):**
```tsx
// Add after Export button, before Theme toggle
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    setBrandPanelOpen(true);
    track("brand_panel_opened");
  }}
>
  <span className="hidden md:inline">Brand</span>
</Button>
```

**Main Page Integration (`/app/page.tsx:38-158`):**
```tsx
export default function PlaygroundPage() {
  const { showOnboardingModal, setShowOnboardingModal } = useOnboardingFlow();
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);

  return (
    <>
      {/* Existing layout */}
      <AppHeader onBrandClick={() => setBrandPanelOpen(true)} />

      {/* Onboarding modal */}
      <OnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
      />

      {/* Brand panel */}
      <Sheet open={brandPanelOpen} onOpenChange={setBrandPanelOpen}>
        <SheetContent side="right">
          <BrandPanel />
        </SheetContent>
      </Sheet>
    </>
  );
}
```

### Edge Cases to Handle

1. **Network Failures**: Retry logic for Supabase operations
2. **Concurrent Sessions**: Handle case where user completes onboarding in another tab
3. **Large Files**: Show progress indicator for uploads >2MB
4. **Invalid Images**: Graceful fallback for corrupted files
5. **Session Expiry**: Re-authenticate user if session expires during upload

### Performance Considerations

1. **Lazy Load**: Only load `OnboardingModal` when needed (dynamic import)
2. **Debounce**: Debounce onboarding status checks (prevent rapid re-queries)
3. **Cache**: Cache brand profile in Jotai atom (reduce Supabase queries)
4. **Optimistic UI**: Show logo immediately after upload, don't wait for storage confirmation

### Accessibility

1. **Keyboard Navigation**: Ensure upload buttons are keyboard accessible
2. **Screen Readers**: Add `aria-label` to upload inputs
3. **Focus Management**: Focus first interactive element when modal opens
4. **Escape to Close**: Modal should close on ESC key

---

## Analytics Events Reference

All events to be tracked (per spec):

| Event Name | When Triggered | Properties |
|------------|----------------|------------|
| `onboarding_modal_shown` | Modal appears for first time | - |
| `onboarding_logo_uploaded` | User uploads logo in onboarding | `{ file_size_kb: number }` |
| `onboarding_skipped` | User clicks "Skip for now" | - |
| `onboarding_completed` | Onboarding finishes (upload or skip) | `{ uploaded_logo: boolean }` |
| `brand_panel_opened` | User clicks "Brand" entry point | - |
| `brand_logo_updated` | User uploads/replaces logo in panel | `{ file_size_kb: number }` |
| `brand_logo_removed` | User removes logo in panel | - |

---

## Success Criteria Verification

✅ **Onboarding modal interaction completes in ≤ 30 seconds**
- Simple upload or skip action
- No multi-step flow
- Immediate feedback on completion

✅ **Users who upload a logo can clearly perceive a difference in output**
- Logo will be visible in generated assets
- Layout capabilities already support logo placement
- Existing `logoAssetAtom` will reference uploaded logo

✅ **Users who skip can later discover and use Brand panel without confusion**
- Persistent "Brand" button in AppHeader
- Clear labeling and familiar sheet UI
- Same upload UX as onboarding

✅ **No increase in abandonment or support questions**
- Optional upload (can skip)
- No blocking or forced steps
- Clear messaging and error handling

---

## Out of Scope (Reminder)

Per the spec, the following are explicitly **NOT** included in v1:

- ❌ Fonts, colors, typography settings
- ❌ Asset history UI
- ❌ Account or billing screens
- ❌ Team or multi-brand support
- ❌ Any onboarding beyond logo modal

These may be added in future iterations but should not be implemented in this phase.

---

## File Structure Summary

```
/components
├── /onboarding
│   └── onboarding-modal.tsx (NEW)
├── /brand
│   └── brand-panel.tsx (NEW)
├── /ui
│   └── sheet.tsx (EXISTS - use as-is)
├── app-header.tsx (MODIFY - add Brand button)
└── ...

/hooks
├── use-onboarding-flow.ts (NEW)
├── use-file-upload.ts (EXISTS - use as-is)
└── atoms.ts (MODIFY - add onboarding atoms if needed)

/app
└── page.tsx (MODIFY - integrate onboarding + brand panel)

/lib
├── analytics.ts (EXISTS - use track() function)
├── supabase-db.ts (EXISTS - use as-is)
└── /auth
    └── provider.tsx (EXISTS - use useAuth() hook)

/supabase
└── /migrations
    └── 20240401T000000_init.sql (EXISTS - tables already created)
```

---

This research provides a complete foundation for implementing the post-signup onboarding modal and brand access features according to the spec. All file paths, patterns, and integration points have been identified and documented with specific line number references.
