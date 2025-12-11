# Implementation Plan: Decouple Screenshot-Gradient Synchronization from Non-Screenshot Looks

## Overview

Currently, when a screenshot is uploaded, the color analysis system automatically generates and applies gradients to **all looks**, including the "code-snippet" look which doesn't use screenshots. This creates unintended coupling where:

1. Screenshot uploads trigger gradient generation for code-snippet look
2. Screenshot-derived gradients transfer to code-snippet when switching looks
3. Code-snippet look should maintain independence with preset gradients only

This plan implements a clean separation where:
- **Screenshot looks** (Peak, Spotlight, Backdrop) receive screenshot-derived gradients
- **Non-screenshot looks** (Code) maintain preset gradients and ignore screenshot color analysis
- Look switching preserves gradients only within the same category

## Implementation Approach

We'll implement **Strategy 1 + Enhanced Look Switching** from the research document:

1. **Phase 1**: Add screenshot capability to look definitions (extensible approach)
2. **Phase 2**: Prevent color analysis for non-screenshot looks
3. **Phase 3**: Smart gradient preservation during look switching
4. **Phase 4**: Testing and validation

This approach is:
- ✅ **Low-risk**: Minimal code changes, no breaking changes
- ✅ **Extensible**: Uses capabilities pattern already in codebase
- ✅ **Type-safe**: Leverages TypeScript for compile-time checks
- ✅ **Future-proof**: Easy to add new non-screenshot looks

---

## Phase 1: Add Screenshot Capability to Look Definitions

### Rationale

The codebase already uses `LookCapabilities` to drive UI behavior (e.g., hiding screenshot section for code-snippet). We'll extend this pattern to include a `screenshot` capability that can be checked programmatically.

### Changes Required

#### 1. Update LookCapabilities Type

**File**: `domain/look/definitions.ts`

**Changes**: Add `screenshot` field to `LookCapabilities` interface

```typescript
export interface LookCapabilities {
  focusMode: LookFocusMode;
  canvasBehavior: LookCanvasBehavior;
  zoomBehavior: LookZoomBehavior;
  text: {
    headline: LookTextRequirement;
    subtitle: LookTextRequirement;
  };
  typography: boolean;
  outline: LookOutlineControls;
  logo: "supported" | "hidden";
  screenshot: "supported" | "hidden";  // NEW: Defines if look uses screenshots
  copyDefaults?: {
    title?: string;
    subtitle?: string;
  };
}
```

**Location**: After line 27, before `copyDefaults`

#### 2. Update Peak (popup-gradient) Look

**File**: `domain/look/definitions.ts`

**Changes**: Add `screenshot: "supported"` to capabilities

```typescript
capabilities: {
  focusMode: "never",
  canvasBehavior: "locked",
  zoomBehavior: "scale-content",
  text: {
    headline: "required",
    subtitle: "optional",
  },
  typography: true,
  outline: {
    softGlass: false,
    shape: false,
    shadow: true,
  },
  logo: "supported",
  screenshot: "supported",  // NEW
  copyDefaults: {
    title: "Bring the heat",
    subtitle: "Keep the heat going",
  },
},
```

**Location**: Around line 89-108

#### 3. Update Spotlight (hero-center) Look

**File**: `domain/look/definitions.ts`

**Changes**: Add `screenshot: "supported"` to capabilities

```typescript
capabilities: {
  focusMode: "never",
  canvasBehavior: "locked",
  zoomBehavior: "scale-container",
  text: {
    headline: "required",
    subtitle: "optional",
  },
  typography: true,
  outline: {
    softGlass: true,
    shape: true,
    shadow: true,
  },
  logo: "supported",
  screenshot: "supported",  // NEW
  copyDefaults: {
    title: "Bring the heat",
    subtitle: "Keep the heat going",
  },
},
```

**Location**: Around line 147-166

#### 4. Update Backdrop (adaptive-stage) Look

**File**: `domain/look/definitions.ts`

**Changes**: Add `screenshot: "supported"` to capabilities

```typescript
capabilities: {
  focusMode: "always",
  canvasBehavior: "adaptive",
  zoomBehavior: "scale-container",
  text: {
    headline: "hidden",
    subtitle: "hidden",
  },
  typography: false,
  outline: {
    softGlass: true,
    shape: true,
    shadow: true,
  },
  logo: "hidden",
  screenshot: "supported",  // NEW
},
```

**Location**: Around line 207-224

#### 5. Update Code (code-snippet) Look

**File**: `domain/look/definitions.ts`

**Changes**: Add `screenshot: "hidden"` to capabilities

```typescript
capabilities: {
  focusMode: "always",
  canvasBehavior: "adaptive",
  zoomBehavior: "scale-container",
  text: {
    headline: "hidden",
    subtitle: "hidden",
  },
  typography: false,
  outline: {
    softGlass: true,
    shape: true,
    shadow: true,
  },
  logo: "hidden",
  screenshot: "hidden",  // NEW
},
```

**Location**: Around line 267-282

#### 6. Add Helper Function to Check Screenshot Support

**File**: `domain/look/definitions.ts`

**Changes**: Add utility function after `getLookDefinition`

```typescript
/**
 * Check if a look supports screenshots based on its capabilities
 */
export function supportsScreenshots(lookId: string): boolean {
  const lookDef = getLookDefinition(lookId);
  return lookDef?.capabilities.screenshot === "supported";
}
```

**Location**: After line 292 (after `getLookDefinition`)

### Success Criteria

#### Automated Verification
- [ ] TypeScript compilation passes: `bun run typecheck`
- [ ] No TypeScript errors about missing `screenshot` field
- [ ] All looks have explicit `screenshot` capability defined

#### Manual Verification
- [ ] Check that 3 looks have `screenshot: "supported"` (Peak, Spotlight, Backdrop)
- [ ] Check that 1 look has `screenshot: "hidden"` (Code)
- [ ] `supportsScreenshots("popup-gradient")` returns `true`
- [ ] `supportsScreenshots("code-snippet")` returns `false`

---

## Phase 2: Prevent Color Analysis for Non-Screenshot Looks

### Rationale

The `useColorAnalysis` hook currently runs for all looks when a screenshot is uploaded. We'll add an early return check to skip color analysis for looks that don't support screenshots.

### Changes Required

#### 1. Update useColorAnalysis Hook

**File**: `hooks/use-color-analysis.ts`

**Changes**: Add early return at the start of `processColorAnalysis`

```typescript
import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { ColorPalette } from "@/domain/asset/types";
import { analyzeColors as analyzeImageColors } from "@/domain/asset/analyze-colors";
import { generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import {
  applyPreferredAngle,
  getGradientColorsForContrast,
} from "@/domain/layout/gradient-application";
import { supportsScreenshots } from "@/domain/look/definitions";  // NEW IMPORT
import type { GradientPreferences } from "@/domain/gradient-generation";
import { configAtom, assetsAtom, statusMessageAtom, isAnalyzingColorsAtom } from "./atoms";

export interface UseColorAnalysisOptions {
  gradientPreferences: GradientPreferences;
}

export function useColorAnalysis({ gradientPreferences }: UseColorAnalysisOptions) {
  const [isAnalyzingColors, setIsAnalyzingColors] = useAtom(isAnalyzingColorsAtom);
  const [config] = useAtom(configAtom);  // NEW: Get current config
  const setAssets = useSetAtom(assetsAtom);
  const setConfig = useSetAtom(configAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  const analyzeColors = useCallback(async (dataUrl: string): Promise<ColorPalette | undefined> => {
    return analyzeImageColors(dataUrl);
  }, []);

  const processColorAnalysis = useCallback(
    async (dataUrl: string, assetId: string, autoLayoutMessage: string | null) => {
      // EARLY RETURN: Skip color analysis for looks that don't support screenshots
      if (!supportsScreenshots(config.lookId)) {
        console.log(`Skipping color analysis for ${config.lookId} - look does not support screenshots`);
        return;
      }

      setIsAnalyzingColors(true);
      setStatusMessage("Analyzing colors from screenshot...");

      try {
        const colorPalette = await analyzeColors(dataUrl);

        if (colorPalette) {
          setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, colorPalette } : a)));
        }

        // ... rest of existing logic remains unchanged
```

**Location**:
- Import addition: After line 9
- Hook change: Add `config` read after line 18
- Early return: After line 28 (start of `processColorAnalysis`)
- Add to dependencies: Add `config.lookId` to dependency array at line 106

**Complete dependency array update**:
```typescript
    },
    [
      analyzeColors,
      config.lookId,  // NEW
      setAssets,
      setConfig,
      setStatusMessage,
      setIsAnalyzingColors,
      gradientPreferences,
    ],
  );
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compilation passes: `bun run typecheck`
- [ ] Build succeeds: `bun run build`
- [ ] No console errors when running app: `bun run dev`

#### Manual Verification
- [ ] Switch to "Code" look
- [ ] Upload a screenshot (should be ignored)
- [ ] Verify console shows: "Skipping color analysis for code-snippet - look does not support screenshots"
- [ ] Verify gradient does NOT change from preset
- [ ] Switch to "Peak" look
- [ ] Upload a screenshot
- [ ] Verify gradient IS generated and applied
- [ ] Verify status message shows: "Gradient applied based on your screenshot colors."

---

## Phase 3: Smart Gradient Preservation During Look Switching

### Rationale

Currently, when switching looks, the gradient is always preserved via `look-selector.tsx:53`. This means screenshot-derived gradients transfer to code-snippet look unintentionally. We'll add logic to reset to default gradient when switching to non-screenshot looks.

### Changes Required

#### 1. Update Look Selector Gradient Preservation Logic

**File**: `components/look-selector.tsx`

**Changes**: Import helper and modify preview config generation

```typescript
"use client";

import { useMemo } from "react";
import { useAtomValue, useSetAtom, Provider, createStore } from "jotai";
import {
  LOOK_DEFINITIONS,
  withLookTextDefaults,
  supportsScreenshots,  // NEW IMPORT
} from "@/domain/look/definitions";
import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/components/preview-viewport";
import { cn } from "@/utils";
import { Sparkles, Type } from "lucide-react";
import { configAtom, assetsAtom, screenshotZoomAtom } from "@/hooks/atoms";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";

// ... existing code ...

export function LookSelector({ className }: { className?: string }) {
  const currentConfig = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const setConfig = useSetAtom(configAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);

  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across look switches
  // BUT reset gradient when switching to non-screenshot looks
  const previewConfigs = useMemo(() => {
    const currentLookSupportsScreenshots = supportsScreenshots(currentConfig.lookId);

    return LOOK_DEFAULTS.map(({ defaultConfig, defaultVariant, key, displayName, look }) => {
      const isTextLook = look.capabilities.text.headline !== "hidden";
      const targetLookSupportsScreenshots = look.capabilities.screenshot === "supported";

      // Determine if we should preserve the current background
      // Only preserve if BOTH looks support screenshots OR BOTH don't support screenshots
      const shouldPreserveBackground =
        currentLookSupportsScreenshots === targetLookSupportsScreenshots;

      const previewConfig = withLookTextDefaults(
        {
          ...defaultConfig,
          variant: defaultVariant,
          text: currentConfig.text,
          assets: currentConfig.assets,
          // Conditionally preserve background
          background: shouldPreserveBackground
            ? currentConfig.background
            : defaultConfig.background,
          colors: currentConfig.colors,
          screenshotShadow: currentConfig.screenshotShadow,
          fontId: currentConfig.fontId,
          fontSize: currentConfig.fontSize,
          screenshotFrame: currentConfig.screenshotFrame,
        } as typeof currentConfig,
        { preserveEmptyText: true },
      );

      return {
        key,
        displayName,
        lookId: look.id,
        previewConfig,
        showTextIcon: isTextLook,
      };
    });
  }, [
    currentConfig.assets,
    currentConfig.background,
    currentConfig.colors,
    currentConfig.fontId,
    currentConfig.fontSize,
    currentConfig.lookId,  // NEW: Add to deps to recalculate when look changes
    currentConfig.screenshotShadow,
    currentConfig.screenshotFrame,
    currentConfig.text,
  ]);

  // ... rest remains unchanged
```

**Key Changes**:
1. Import `supportsScreenshots` (line 8)
2. Calculate `currentLookSupportsScreenshots` (line 29)
3. Calculate `targetLookSupportsScreenshots` (line 33)
4. Conditionally preserve background (lines 35-37)
5. Use conditional background in config (lines 44-46)
6. Add `currentConfig.lookId` to dependencies (line 77)

### Success Criteria

#### Automated Verification
- [ ] TypeScript compilation passes: `bun run typecheck`
- [ ] Build succeeds: `bun run build`
- [ ] No React hooks dependency warnings

#### Manual Verification
- [ ] **Scenario 1: Screenshot Look → Code Look**
  - [ ] Start in "Peak" look
  - [ ] Upload screenshot (gradient applied)
  - [ ] Switch to "Code" look
  - [ ] Verify: Gradient resets to random preset (not screenshot colors)
  - [ ] Verify: Code content is preserved

- [ ] **Scenario 2: Code Look → Screenshot Look**
  - [ ] Start in "Code" look with preset gradient
  - [ ] Switch to "Peak" look
  - [ ] Verify: Gradient changes to Peak's default
  - [ ] Upload screenshot
  - [ ] Verify: Screenshot gradient is applied

- [ ] **Scenario 3: Screenshot Look → Screenshot Look**
  - [ ] Start in "Peak" look
  - [ ] Upload screenshot (gradient applied)
  - [ ] Switch to "Spotlight" look
  - [ ] Verify: Screenshot-derived gradient IS preserved
  - [ ] Verify: Screenshot is still displayed

- [ ] **Scenario 4: Code Look → Code Look** (future-proofing)
  - [ ] Currently only one code look exists
  - [ ] Logic should preserve gradient if switching between code looks
  - [ ] Can verify by temporarily duplicating code-snippet definition

---

## Phase 4: Testing & Validation

### Rationale

Comprehensive testing ensures the decoupling works correctly across all edge cases and doesn't introduce regressions.

### Changes Required

#### 1. Create Manual Test Plan Document

**File**: `thoughts/research/006-screenshot-gradient-decoupling-test-results.md`

**Changes**: Document test results

```markdown
# Test Results: Screenshot-Gradient Decoupling

## Test Date: [DATE]

## Environment
- Browser: [Chrome/Firefox/Safari]
- OS: [macOS/Windows/Linux]
- Build: [commit hash]

## Test Scenarios

### ✅ Scenario 1: Color Analysis Skip for Code Look
- [ ] Switch to Code look
- [ ] Upload screenshot
- [ ] Console shows skip message
- [ ] Gradient unchanged
- [ ] Screenshot not displayed

### ✅ Scenario 2: Color Analysis Works for Screenshot Looks
- [ ] Switch to Peak look
- [ ] Upload screenshot
- [ ] Gradient generated from screenshot
- [ ] Text color adjusted for contrast
- [ ] Screenshot displayed

### ✅ Scenario 3: Gradient Reset on Screenshot → Code Switch
- [ ] Peak look with screenshot gradient
- [ ] Switch to Code look
- [ ] Gradient resets to preset
- [ ] No screenshot artifacts

### ✅ Scenario 4: Gradient Preserved on Screenshot → Screenshot Switch
- [ ] Peak look with screenshot gradient
- [ ] Switch to Spotlight look
- [ ] Gradient preserved
- [ ] Screenshot preserved

### ✅ Scenario 5: Multiple Screenshot Uploads in Screenshot Look
- [ ] Upload screenshot A
- [ ] Gradient A applied
- [ ] Upload screenshot B
- [ ] Gradient B replaces A

### ✅ Scenario 6: Screenshot Upload Then Look Switch Then Upload
- [ ] Upload screenshot in Peak
- [ ] Switch to Spotlight
- [ ] Upload new screenshot
- [ ] New gradient applied

## Edge Cases

### ✅ Edge Case 1: No Screenshot, Switch to Code
- [ ] No screenshot uploaded
- [ ] Switch to Code look
- [ ] Random preset gradient shown
- [ ] No errors

### ✅ Edge Case 2: Screenshot in Peak, Delete Asset, Switch to Code
- [ ] Upload screenshot in Peak
- [ ] Clear screenshot
- [ ] Switch to Code
- [ ] Preset gradient shown

## Regression Checks

### ✅ Existing Functionality Preserved
- [ ] Gradient picker shows presets
- [ ] Custom gradient creation works
- [ ] Solid color backgrounds work
- [ ] Image backgrounds work
- [ ] Text color contrast works
- [ ] Screenshot frame controls work
- [ ] Look text defaults apply correctly

## Performance

- [ ] No noticeable lag when switching looks
- [ ] Color analysis completes in reasonable time (<3s)
- [ ] No memory leaks (check DevTools)

## Bugs Found

[Document any bugs discovered during testing]

## Notes

[Any additional observations]
```

**Location**: New file in `thoughts/research/`

#### 2. Test in Development Environment

**Manual Steps**:

1. Start dev server: `bun run dev`
2. Open browser to `localhost:3000` (or configured port)
3. Execute all test scenarios from test plan
4. Document results in test results file
5. Fix any bugs discovered
6. Re-test until all scenarios pass

### Success Criteria

#### Automated Verification
- [ ] All builds pass: `bun run build`
- [ ] Type checking passes: `bun run typecheck`
- [ ] No console errors in browser DevTools

#### Manual Verification
- [ ] All test scenarios pass (marked with ✅ in test results)
- [ ] All edge cases handled correctly
- [ ] No regressions in existing functionality
- [ ] Performance is acceptable

---

## Rollback Plan

If issues are discovered after deployment:

### Quick Rollback (5 minutes)

1. **Revert color analysis change**:
   ```typescript
   // hooks/use-color-analysis.ts
   // Comment out the early return:
   /*
   if (!supportsScreenshots(config.lookId)) {
     console.log(`Skipping color analysis for ${config.lookId}`);
     return;
   }
   */
   ```

2. **Revert look selector change**:
   ```typescript
   // components/look-selector.tsx
   // Restore original background preservation:
   background: currentConfig.background,  // Always preserve
   ```

3. **Rebuild and deploy**:
   ```bash
   bun run build
   # Deploy build/
   ```

### Full Rollback (10 minutes)

Use git to revert the entire commit:

```bash
# Find the commit hash
git log --oneline -5

# Revert the commit
git revert <commit-hash>

# Push the revert
git push origin main
```

### Rollback Considerations

- Screenshots uploaded during the buggy deployment are **safe** (stored in assets)
- User configs may have screenshot-derived gradients - these are **safe**
- Rolling back will restore the old behavior where all looks get screenshot gradients
- No data loss occurs during rollback

---

## Post-Implementation Tasks

### Documentation Updates

1. **Update look authoring guide**:
   - File: `domain/look/AUTHORING.md`
   - Add section on `screenshot` capability
   - Explain when to use "supported" vs "hidden"

2. **Add JSDoc comments**:
   ```typescript
   /**
    * Determines if a look supports screenshot uploads and screenshot-derived gradients.
    *
    * Looks with `screenshot: "supported"` will:
    * - Display screenshot section in UI
    * - Trigger color analysis on screenshot upload
    * - Receive screenshot-derived gradients
    *
    * Looks with `screenshot: "hidden"` will:
    * - Hide screenshot section in UI
    * - Skip color analysis
    * - Use preset gradients only
    *
    * @param lookId - The ID of the look to check
    * @returns true if the look supports screenshots, false otherwise
    */
   export function supportsScreenshots(lookId: string): boolean {
     const lookDef = getLookDefinition(lookId);
     return lookDef?.capabilities.screenshot === "supported";
   }
   ```

### Future Enhancements (Optional)

Consider these improvements in future iterations:

1. **Gradient Source Tracking** (from Research Strategy 3):
   - Add `source: "preset" | "screenshot" | "custom"` to `BackgroundConfig`
   - Display source in UI (e.g., "From screenshot" badge)
   - Allow filtering gradients by source

2. **Lock Gradient Feature**:
   - Add `background.locked: boolean` flag
   - Prevent auto-updates when locked
   - Add lock/unlock button in UI

3. **Look Categories**:
   - Group looks by category (screenshot-based, code-based, text-based)
   - Show category in look selector
   - Filter looks by category

4. **Unit Tests**:
   - Test `supportsScreenshots()` with all look IDs
   - Test color analysis skip logic
   - Test gradient preservation logic
   - Mock screenshot uploads in tests

---

## Summary

### What Changed
- ✅ Added `screenshot` capability to all look definitions
- ✅ Created `supportsScreenshots()` helper function
- ✅ Modified color analysis to skip non-screenshot looks
- ✅ Updated look selector to preserve gradients within look categories only

### What Stays the Same
- ✅ Screenshot looks (Peak, Spotlight, Backdrop) work exactly as before
- ✅ Gradient picker UI unchanged
- ✅ Custom gradient creation unchanged
- ✅ Look switching preserves text, assets, and other settings

### Impact
- 🎯 **Code look** now maintains independence from screenshots
- 🎯 **Screenshot uploads** don't affect code look's gradient
- 🎯 **Look switching** is smarter about gradient preservation
- 🎯 **Extensibility** improved for future non-screenshot looks

### Effort Summary
- **Files modified**: 3
- **Lines of code**: ~50
- **Risk level**: Low
- **Estimated time**: 1-2 hours (including testing)
