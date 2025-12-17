# Implementation Plan: Post-Signup Onboarding Modal + Brand Access (v1)

## Overview

This plan implements a post-signup onboarding modal that collects an optional brand logo immediately after the user's first authenticated session, plus a persistent "Brand" entry point in the builder for ongoing logo management. The feature focuses on delivering value quickly (collect one brand signal) while ensuring users can always return to manage their brand settings later.

## Implementation Approach

We'll implement this in 4 focused phases:

1. **Onboarding Flow Hook & Modal** - Build the core onboarding detection and modal UI
2. **Brand Panel Component** - Create persistent brand access panel
3. **Builder Integration** - Connect onboarding + brand panel to main builder
4. **Testing & Polish** - Verify cross-session persistence, error handling, analytics

**Why this approach:**
- Builds from foundation (detection) to UI (modal/panel) to integration (builder)
- Each phase is independently testable
- Leverages existing patterns (Sheet, useFileUpload, Jotai, Supabase)
- Minimizes disruption to existing builder functionality

---

## Phase 1: Onboarding Flow Hook & Modal

### Changes Required

#### 1. Onboarding Flow Hook
**File**: `hooks/use-onboarding-flow.ts` (NEW)

**Purpose**: Detects first-time users and manages onboarding modal state

```typescript
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

        if (error) {
          console.error("Failed to fetch onboarding status:", error);
          setIsChecking(false);
          return;
        }

        const progress = data?.onboarding_progress || [];
        const hasCompleted =
          progress.includes("logo_onboarding_completed") ||
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

**Key Features:**
- Queries `user_metadata.onboarding_progress` to check completion
- Tracks `onboarding_modal_shown` event on first display
- Returns loading state to prevent flash of modal

#### 2. Onboarding Modal Component
**File**: `components/onboarding/onboarding-modal.tsx` (NEW)

**Purpose**: Single-screen modal for optional logo upload

```typescript
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleUpload = async (file: File) => {
    if (!user) return;

    try {
      // Process file locally (validation + add to assetsAtom)
      await handleFileProcess(file, "logo");

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const path = `${user.id}/logo-${timestamp}.${extension}`;

      const { error: uploadError } = await supabaseDb.storage
        .from("brand-logos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update brand profile
      const { error: profileError } = await supabaseDb
        .from("brand_profiles")
        .update({ logo_path: path })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Mark onboarding complete
      const { error: metadataError } = await supabaseDb
        .from("user_metadata")
        .update({ onboarding_progress: ["logo_onboarding_completed"] })
        .eq("user_id", user.id);

      if (metadataError) throw metadataError;

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
      const { error } = await supabaseDb
        .from("user_metadata")
        .update({ onboarding_progress: ["logo_onboarding_skipped"] })
        .eq("user_id", user.id);

      if (error) throw error;

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
                onChange={(e) =>
                  e.target.files?.[0] && handleUpload(e.target.files[0])
                }
                className="hidden"
                id="logo-upload"
                aria-label="Upload logo file"
              />
              <label htmlFor="logo-upload">
                <Button
                  variant="default"
                  disabled={isProcessingUpload}
                  asChild
                  className="w-full"
                >
                  <span>Upload logo</span>
                </Button>
              </label>

              <Button
                variant="secondary"
                onClick={handleSkip}
                disabled={isProcessingUpload}
                className="w-full"
              >
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

**Key Features:**
- Uses existing `Sheet` component for consistent modal UI
- Leverages `useFileUpload` hook for validation (already handles PNG/JPG/WebP/SVG, 10MB limit)
- Uploads to `brand-logos` Supabase storage bucket
- Updates `brand_profiles.logo_path` and `user_metadata.onboarding_progress`
- Tracks all analytics events per spec
- Shows success message before closing
- Full keyboard accessibility (aria-label on file input)

### Success Criteria

#### Automated Verification
- [ ] Types check: `pnpm typecheck`
- [ ] Build passes: `pnpm build`

#### Manual Verification
- [ ] Hook correctly detects new users (onboarding_progress is empty array)
- [ ] Hook does NOT show modal for users who completed/skipped onboarding
- [ ] Modal appears with correct title and description
- [ ] Upload button triggers file picker
- [ ] Skip button closes modal immediately
- [ ] File validation works (rejects files >10MB, non-image types)
- [ ] Success message "Saved." appears after upload
- [ ] Modal closes automatically 1 second after success
- [ ] `onboarding_modal_shown` event fires when modal appears
- [ ] `onboarding_logo_uploaded` event fires with file_size_kb property
- [ ] `onboarding_skipped` event fires when skip clicked
- [ ] `onboarding_completed` event fires with uploaded_logo property
- [ ] Check browser console: No errors during upload/skip
- [ ] Check Supabase dashboard: Logo file appears in brand-logos bucket
- [ ] Check Supabase dashboard: brand_profiles.logo_path updated
- [ ] Check Supabase dashboard: user_metadata.onboarding_progress updated

---

## Phase 2: Brand Panel Component

### Changes Required

#### 1. Brand Panel Component
**File**: `components/brand/brand-panel.tsx` (NEW)

**Purpose**: Persistent panel for logo management (add/replace/remove)

```typescript
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
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabaseDb
          .from("brand_profiles")
          .select("logo_path")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Failed to load brand profile:", error);
          setIsLoading(false);
          return;
        }

        if (data?.logo_path) {
          const { data: urlData } = supabaseDb.storage
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

      const { error: uploadError } = await supabaseDb.storage
        .from("brand-logos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: profileError } = await supabaseDb
        .from("brand_profiles")
        .update({ logo_path: path })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      const { data: urlData } = supabaseDb.storage
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

      const { error } = await supabaseDb
        .from("brand_profiles")
        .update({ logo_path: null })
        .eq("user_id", user.id);

      if (error) throw error;

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
            <img
              src={logoUrl}
              alt="Brand logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleUpload(e.target.files[0])
              }
              className="hidden"
              id="logo-replace"
              aria-label="Replace logo file"
            />
            <label htmlFor="logo-replace" className="flex-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={isProcessingUpload}
                asChild
                className="w-full"
              >
                <span>Replace</span>
              </Button>
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isProcessingUpload}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && handleUpload(e.target.files[0])
            }
            className="hidden"
            id="logo-add"
            aria-label="Add logo file"
          />
          <label htmlFor="logo-add">
            <Button
              variant="default"
              size="sm"
              disabled={isProcessingUpload}
              asChild
              className="w-full"
            >
              <span>Add logo</span>
            </Button>
          </label>
        </>
      )}
    </div>
  );
}
```

**Key Features:**
- Loads existing logo from Supabase on mount
- Shows preview when logo exists
- Provides Replace/Remove actions when logo exists
- Provides Add action when no logo
- Uses same upload flow as onboarding modal
- Tracks `brand_logo_updated` and `brand_logo_removed` events

### Success Criteria

#### Automated Verification
- [ ] Types check: `pnpm typecheck`
- [ ] Build passes: `pnpm build`

#### Manual Verification
- [ ] Panel loads existing logo if user has one
- [ ] Panel shows "Add logo" button if no logo exists
- [ ] "Add logo" triggers file picker
- [ ] Logo preview displays after upload
- [ ] "Replace" button updates logo with new file
- [ ] "Remove" button deletes logo and shows "Add logo" button again
- [ ] Loading state shows while fetching brand profile
- [ ] `brand_logo_updated` event fires with file_size_kb property
- [ ] `brand_logo_removed` event fires when logo removed
- [ ] Check Supabase dashboard: Logo files updated correctly
- [ ] Check browser console: No errors during upload/remove

---

## Phase 3: Builder Integration

### Changes Required

#### 1. App Header - Add Brand Button
**File**: `components/app-header.tsx`

**Changes**: Add "Brand" button to header actions

Find the button group around lines 45-73 and add the Brand button:

```typescript
// Add state import at top
import { useState } from "react";

// Add after Export button, before theme toggle (around line 60)
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    onBrandClick();
    track("brand_panel_opened");
  }}
>
  <span className="hidden md:inline">Brand</span>
</Button>
```

**Add prop to AppHeader interface:**
```typescript
interface AppHeaderProps {
  onBrandClick: () => void;
}
```

**Import track:**
```typescript
import { track } from "@/lib/analytics";
```

#### 2. Main Builder Page - Integrate Onboarding + Brand Panel
**File**: `app/page.tsx`

**Changes**: Add onboarding modal and brand panel to builder

```typescript
// Add imports at top (around line 1-20)
import { useState } from "react";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { BrandPanel } from "@/components/brand/brand-panel";
import { useOnboardingFlow } from "@/hooks/use-onboarding-flow";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// In PlaygroundPage component (around line 38-40)
export default function PlaygroundPage() {
  const { showOnboardingModal, setShowOnboardingModal } = useOnboardingFlow();
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);

  // ... existing code (orientation, isExporting, etc.)

  return (
    <>
      {/* Existing AppHeader - add onBrandClick prop */}
      <AppHeader onBrandClick={() => setBrandPanelOpen(true)} />

      {/* ... existing layout code ... */}

      {/* Add onboarding modal before closing fragment */}
      <OnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
      />

      {/* Add brand panel before closing fragment */}
      <Sheet open={brandPanelOpen} onOpenChange={setBrandPanelOpen}>
        <SheetContent side="right">
          <BrandPanel />
        </SheetContent>
      </Sheet>
    </>
  );
}
```

### Success Criteria

#### Automated Verification
- [ ] Types check: `pnpm typecheck`
- [ ] Build passes: `pnpm build`
- [ ] Dev server runs without errors: `pnpm dev`

#### Manual Verification
- [ ] **First-time user flow:**
  - [ ] Sign up for new account
  - [ ] Onboarding modal appears automatically in builder
  - [ ] Upload logo → Modal shows "Saved." → Modal closes
  - [ ] OR Skip → Modal closes immediately
  - [ ] Refresh page → Modal does NOT appear again
- [ ] **Brand panel access:**
  - [ ] Click "Brand" button in header
  - [ ] Brand panel slides in from right
  - [ ] Panel shows logo if onboarding upload succeeded
  - [ ] Panel shows "Add logo" if onboarding was skipped
  - [ ] Upload/Replace/Remove actions work as expected
  - [ ] Close panel → Panel slides out
- [ ] **Cross-session persistence:**
  - [ ] Upload logo in onboarding
  - [ ] Sign out
  - [ ] Sign back in
  - [ ] Open Brand panel → Logo still there
- [ ] **Analytics verification (check browser console or Umami dashboard):**
  - [ ] `onboarding_modal_shown` fires on first login
  - [ ] `onboarding_logo_uploaded` fires with file_size_kb
  - [ ] `onboarding_skipped` fires when skip clicked
  - [ ] `onboarding_completed` fires with uploaded_logo property
  - [ ] `brand_panel_opened` fires when Brand button clicked
  - [ ] `brand_logo_updated` fires when logo uploaded in panel
  - [ ] `brand_logo_removed` fires when logo removed in panel

---

## Phase 4: Testing & Polish

### Changes Required

#### 1. Error Handling Improvements

**File**: `hooks/use-onboarding-flow.ts`

Add retry logic for network failures:

```typescript
// Wrap checkOnboardingStatus in retry logic
const MAX_RETRIES = 3;
let retries = 0;

async function checkOnboardingStatusWithRetry() {
  try {
    await checkOnboardingStatus();
  } catch (error) {
    if (retries < MAX_RETRIES) {
      retries++;
      setTimeout(checkOnboardingStatusWithRetry, 2000 * retries); // exponential backoff
    } else {
      console.error("Failed to check onboarding status after retries:", error);
      setIsChecking(false);
    }
  }
}
```

**File**: `components/onboarding/onboarding-modal.tsx` & `components/brand/brand-panel.tsx`

Add user-friendly error messages:

```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);

// In handleUpload catch block:
catch (error) {
  console.error("Upload failed:", error);
  setUploadStatus("error");
  setErrorMessage(
    error instanceof Error
      ? error.message
      : "Upload failed. Please check your connection and try again."
  );
}

// In UI:
{uploadStatus === "error" && errorMessage && (
  <p className="text-sm text-red-600 dark:text-red-400">
    {errorMessage}
  </p>
)}
```

#### 2. Performance Optimization

**File**: `app/page.tsx`

Lazy load OnboardingModal (only load when needed):

```typescript
import dynamic from "next/dynamic";

const OnboardingModal = dynamic(
  () => import("@/components/onboarding/onboarding-modal").then(mod => ({ default: mod.OnboardingModal })),
  { ssr: false }
);
```

#### 3. Accessibility Improvements

**Files**: `components/onboarding/onboarding-modal.tsx` & `components/brand/brand-panel.tsx`

Ensure focus management:

```typescript
// Add ref to first interactive element
import { useRef, useEffect } from "react";

const uploadButtonRef = useRef<HTMLLabelElement>(null);

useEffect(() => {
  if (open && uploadButtonRef.current) {
    uploadButtonRef.current.focus();
  }
}, [open]);

// Update label with ref:
<label htmlFor="logo-upload" ref={uploadButtonRef} tabIndex={0}>
  <Button variant="default" disabled={isProcessingUpload} asChild>
    <span>Upload logo</span>
  </Button>
</label>
```

### Success Criteria

#### Automated Verification
- [ ] Types check: `pnpm typecheck`
- [ ] Build passes: `pnpm build`
- [ ] Dev server runs without errors: `pnpm dev`

#### Manual Verification

**Error Handling:**
- [ ] Disconnect network → Upload logo → Error message appears
- [ ] Reconnect network → Retry upload → Success
- [ ] Invalid file type → Upload → Appropriate error message

**Performance:**
- [ ] OnboardingModal only loads when needed (check Network tab)
- [ ] Brand panel loads quickly (check Performance tab)
- [ ] No unnecessary re-renders (check React DevTools)

**Accessibility:**
- [ ] Tab navigation works through modal buttons
- [ ] Enter/Space keys trigger file picker when upload button focused
- [ ] ESC key closes modal
- [ ] Screen reader announces modal title and description
- [ ] Focus moves to first button when modal opens
- [ ] Focus returns to Brand button when panel closes

**Edge Cases:**
- [ ] Complete onboarding in Tab A → Open Tab B → Modal doesn't appear
- [ ] Upload logo >10MB → Validation error message appears
- [ ] Upload corrupted image → Error message appears
- [ ] Sign out during upload → No errors in console
- [ ] Remove logo that was already deleted in another tab → Graceful handling

**RLS Policy Verification:**
- [ ] Create two test accounts
- [ ] Upload logo in Account A
- [ ] Try to access Account A's logo URL while logged into Account B → 403 Forbidden
- [ ] Verify each user can only see their own logo

**Logo Integration with Generated Assets:**
- [ ] Upload logo in onboarding
- [ ] Select layout that supports logos (e.g., "popup-gradient")
- [ ] Generate/export asset
- [ ] Verify logo appears in output
- [ ] Remove logo in Brand panel
- [ ] Generate/export asset
- [ ] Verify logo no longer appears in output

---

## Rollback Plan

If issues arise during implementation:

### Phase 1 Rollback
```bash
# Remove onboarding files
rm hooks/use-onboarding-flow.ts
rm -rf components/onboarding
```

### Phase 2 Rollback
```bash
# Remove brand panel files
rm -rf components/brand
```

### Phase 3 Rollback
```bash
# Revert changes to app-header.tsx and app/page.tsx
git checkout components/app-header.tsx app/page.tsx
```

### Phase 4 Rollback
```bash
# Revert error handling and optimization changes
git checkout hooks/use-onboarding-flow.ts components/onboarding/onboarding-modal.tsx components/brand/brand-panel.tsx app/page.tsx
```

### Database Rollback (if needed)
```sql
-- Clear onboarding progress for all users (start fresh)
UPDATE user_metadata SET onboarding_progress = '[]'::jsonb;

-- Clear all logo paths
UPDATE brand_profiles SET logo_path = NULL;

-- Delete all files from brand-logos bucket (via Supabase dashboard)
```

---

## Notes

- **Database schema already exists** - No migration needed, tables and buckets are ready
- **RLS policies are enforced** - Users can only access their own data
- **File validation is handled** - useFileUpload hook validates type, size, extension
- **Analytics is ready** - track() function from lib/analytics.ts is available
- **No new dependencies needed** - All required packages already installed

## Out of Scope

Per the spec, these are explicitly NOT included in v1:
- ❌ Fonts, colors, typography settings
- ❌ Asset history UI
- ❌ Account or billing screens
- ❌ Team or multi-brand support
- ❌ Any onboarding beyond logo modal

These may be added in future iterations.

---

## Success Metrics

After implementation, verify these key metrics:

1. **Completion time**: Onboarding flow completes in ≤ 30 seconds ✅
2. **Logo visibility**: Users can see logo in generated assets ✅
3. **Discoverability**: Users who skip can find Brand panel ✅
4. **No abandonment**: No increase in support questions ✅

All 7 analytics events firing correctly:
- `onboarding_modal_shown`
- `onboarding_logo_uploaded`
- `onboarding_skipped`
- `onboarding_completed`
- `brand_panel_opened`
- `brand_logo_updated`
- `brand_logo_removed`
