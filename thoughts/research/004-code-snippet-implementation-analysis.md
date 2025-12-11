# Research: Code Snippet Look Implementation Analysis

**Date:** 2025-12-11
**Branch:** claude/add-code-formatter-01HCM5ZHgoeafC7nmxSvHe8c
**Purpose:** Deep dive into code snippet implementation to identify sizing issues, Shiki configuration, and effects tab problems

## Executive Summary

This research investigates the code snippet look implementation added to the codebase. Three key issues identified:

1. **Container Sizing Issue**: Code container uses fixed padding (32px) that doesn't scale with content. Should use minimal 24px padding that remains constant as content grows.
2. **Shiki Language Detection**: Currently requires manual language selection. Shiki supports automatic language detection but it's not implemented.
3. **Effects Tab**: The effects section exists in the sidebar but none of the effects are actually working for the code snippet look.

---

## Key Files & Locations

### Core Implementation

| File | Purpose | Key Lines |
|------|---------|-----------|
| `components/looks/CodeSnippet.tsx` | Main code snippet rendering component with Shiki integration | 27-54 (Shiki), 65-72 (container), 81-93 (styling) |
| `components/sidebar-sections/code-section.tsx` | Configuration UI for code, language, and theme selection | 8-28 (languages), 30-40 (themes), 46-124 (handlers) |
| `domain/look/definitions.ts` | Look type definitions and default configurations | 264-283 (code-snippet look) |
| `domain/layout/types.ts` | Type definitions for layout configuration | 112-116 (code config type) |
| `components/layout-config.tsx` | Sidebar accordion with effects tab | 94-103 (effects tab), 37-38 (code section) |
| `components/sidebar-sections/effects-section.tsx` | Effects controls UI (soft glass, corners, shadow) | 85-113 (toggle rows), 30-71 (handlers) |

### Supporting Files

| File | Purpose | Key Lines |
|------|---------|-----------|
| `components/looks/shared/look-primitives.tsx` | Shared primitives for look components | useLookPrimitives hook, LookSurface |
| `components/looks/shared/screenshot-frame.ts` | Frame appearance and effects logic | 24-73 (soft glass presets) |
| `components/looks/registry.ts` | Maps look IDs to components | code-snippet → CodeSnippet |

---

## Architecture & Data Flow

### 1. User Interaction Flow

```
User Input (CodeSection)
  → State Update (configAtom via Jotai)
  → Component Re-render (CodeSnippet)
  → Shiki Processing (codeToHtml async)
  → HTML Rendering (dangerouslySetInnerHTML)
```

### 2. Configuration Storage

**Type Definition** (`domain/layout/types.ts:112-116`):
```typescript
code?: {
  content: string;
  language: string;
  theme?: string;
};
```

**Default Values** (`domain/look/definitions.ts:264-268`):
```typescript
code: {
  content: '// Paste your code here\nfunction hello() {\n  console.log("Hello, World!");\n}',
  language: "javascript",
  theme: "github-dark",
}
```

### 3. Shiki Integration

**Initialization** (`components/looks/CodeSnippet.tsx:4`):
```typescript
import { codeToHtml } from "shiki";
```

**Processing** (`components/looks/CodeSnippet.tsx:32-35`):
```typescript
const html = await codeToHtml(code, {
  lang: language,
  theme: theme,
});
```

**Error Handling** (`components/looks/CodeSnippet.tsx:44`):
- Fallback to plain text if Shiki fails
- Graceful degradation with console error

---

## Current Container Sizing Logic

### Problem Identified

The code snippet container currently uses **fixed padding values** that don't properly scale with content:

**CodeSnippet.tsx:65** - Outer container padding:
```tsx
className="relative z-10 flex h-full w-full items-center justify-center p-8"
// p-8 = 32px padding (should be 24px and constant)
```

**CodeSnippet.tsx:84** - Code block internal padding:
```tsx
padding: 2rem;  // 32px (should be 24px and constant)
```

**CodeSnippet.tsx:66** - Max width constraint:
```tsx
<div className="w-full max-w-4xl">
// Max width: 896px (should scale with content)
```

### Expected Behavior

According to requirements:
- **Default**: Minimal wrapping with 24px padding around code content
- **Content Growth**: Container expands with content, padding stays 24px
- **Current Issue**: Using 32px padding and fixed max-width instead of content-adaptive sizing

### Container Dimension Summary

| Component | Current Padding | Expected Padding | Issue |
|-----------|----------------|------------------|-------|
| Outer container (`p-8`) | 32px | 24px | Wrong value |
| Code block (`padding: 2rem`) | 32px | 24px | Wrong value |
| Max width constraint | 896px (max-w-4xl) | Content-based | Should grow with content |

---

## Shiki Configuration Analysis

### Current Language Detection

**Manual Selection Required** (`components/sidebar-sections/code-section.tsx:8-28`):
- 19 languages available in dropdown
- User must explicitly select language
- Defaults to "javascript" if not specified

**Available Languages**:
JavaScript, TypeScript, Python, Java, Go, Rust, C++, C#, PHP, Ruby, Swift, Kotlin, HTML, CSS, JSON, YAML, Markdown, SQL, Bash

### Automatic Language Detection

**Shiki Capability**: Shiki v3 supports automatic language detection through:
1. **Built-in grammar detection**: Analyze code patterns
2. **`lang: 'auto'`** parameter (if supported in version 3.19.0)
3. **External language detection libraries**: Could integrate with libraries like `language-detect` or `guesslang`

**Implementation Gap**:
- Current code explicitly passes `lang: language` to Shiki
- No fallback to auto-detection when language is unknown
- Could enhance UX by detecting language from code content

**Recommendation**:
- Check Shiki 3.19.0 docs for built-in auto-detection support
- If not available, integrate language detection library before Shiki call
- Maintain manual override capability for user control

### Theme Configuration

**Available Themes** (`components/sidebar-sections/code-section.tsx:30-40`):
- 9 themes: GitHub Dark/Light, Dracula, Nord, Monokai, One Dark Pro, Material Theme, Solarized Dark/Light
- Default: `github-dark`
- Theme switching handled correctly with state updates

**Shiki Configuration** (`components/looks/CodeSnippet.tsx:32-35`):
```typescript
const html = await codeToHtml(code, {
  lang: language,     // Language ID string
  theme: theme,       // Theme name string
  // No additional options configured
});
```

**Missing Options**:
- Line wrapping configuration
- Tab size/indentation settings
- Line highlighting
- Line numbers toggle

---

## Effects Tab Investigation

### Effects Definition

**Available Effects** (`domain/look/definitions.ts:7-11`):
```typescript
type LookOutlineControls = {
  softGlass?: boolean;    // Glass-effect frame with backdrop blur
  shape?: "rounded" | "rectangular";  // Corner style
  shadowEnabled?: boolean;  // Shadow on screenshot frame
};
```

### Code Snippet Look Capabilities

**Enabled Effects** (`domain/look/definitions.ts:279-283`):
```typescript
outline: {
  softGlass: true,      // ✓ Available
  shape: true,          // ✓ Available
  shadowEnabled: true,  // ✓ Available
}
```

### Effects UI

**Sidebar Location** (`components/layout-config.tsx:94-103`):
- Effects accordion item in sidebar
- Uses `EffectsSection` component
- Always visible for all looks

**Controls** (`components/sidebar-sections/effects-section.tsx:85-113`):
1. **Soft Glass Toggle** (Lines 86-95): Handlers at lines 30-43
2. **Corners Toggle** (Lines 96-103): Handlers at lines 45-58
3. **Shadow Toggle** (Lines 104-111): Handlers at lines 60-71

### Problem: Effects Not Working

**Expected Behavior**:
Effects should modify the code snippet frame appearance:
- Soft Glass: Apply glass effect with backdrop blur
- Corners: Toggle between rounded/rectangular corners
- Shadow: Enable/disable shadow on frame

**Investigation Points**:
1. **LookSurface Integration** (`components/looks/CodeSnippet.tsx:57-64`):
   - CodeSnippet wraps content in LookSurface
   - LookSurface should apply screenshot frame treatment
   - Need to verify if screenshotFrame config is passed correctly

2. **Screenshot Frame Application** (`components/looks/shared/screenshot-frame.ts:24-73`):
   - `getScreenshotFrameAppearance` function generates frame styles
   - Takes `preset` (soft glass), `shape`, and `shadowEnabled` parameters
   - Generates CSS for background, border, shadow, blur

3. **State Management** (`hooks/atoms.ts`):
   - Effects stored in `config.screenshotFrame`
   - Changes should trigger component re-render
   - Need to verify state updates propagate correctly

**Likely Issue**:
- CodeSnippet may not be reading screenshotFrame config from state
- LookSurface might not be applying screenshot frame styles
- Effects handlers may not be updating the correct state path

---

## Patterns to Follow

### 1. Look Component Structure

```typescript
// Standard look component pattern
export function LookComponent() {
  const { config, screenshot, updateConfig } = useLookPrimitives();

  // Extract configuration
  const specificConfig = config.code || defaultConfig;

  // Render with LookSurface wrapper
  return (
    <LookSurface>
      {/* Content */}
    </LookSurface>
  );
}
```

### 2. Configuration Updates

```typescript
// Pattern for updating specific config sections
const updateValue = (field: string, value: any) => {
  setConfig((prev) => ({
    ...prev,
    code: {
      ...prev.code,
      [field]: value,
    },
  }));
};
```

### 3. Async Content Processing

```typescript
// Pattern for async transformations (like Shiki)
useEffect(() => {
  const process = async () => {
    try {
      const result = await processingFunction(input);
      setState(result);
    } catch (error) {
      console.error("Processing failed:", error);
      setState(fallbackValue);
    }
  };
  process();
}, [dependencies]);
```

---

## Code Examples

### Current CodeSnippet Container (PROBLEM)

**File**: `components/looks/CodeSnippet.tsx:65-72`
```tsx
<div className="relative z-10 flex h-full w-full items-center justify-center p-8">
  <div className="w-full max-w-4xl">
    <div
      className="overflow-hidden rounded-2xl shadow-2xl"
      style={{
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
    >
```

**Issues**:
- `p-8` = 32px padding (should be 24px)
- `max-w-4xl` = 896px max width (should be content-based)
- Fixed shadow (should respect effects settings)

### Current Shiki Usage (MISSING AUTO-DETECTION)

**File**: `components/looks/CodeSnippet.tsx:27-39`
```tsx
useEffect(() => {
  const highlightCode = async () => {
    try {
      const html = await codeToHtml(code, {
        lang: language,  // Always requires explicit language
        theme: theme,
      });
      setHighlightedCode(html);
    } catch (error) {
      console.error("Failed to highlight code:", error);
      setHighlightedCode(`<pre><code>${code}</code></pre>`);
    }
  };

  highlightCode();
}, [code, language, theme]);
```

**Missing**: No automatic language detection fallback

### Effects Handler Example

**File**: `components/sidebar-sections/effects-section.tsx:30-43`
```tsx
const toggleSoftGlass = useCallback(() => {
  setConfig((prev) => {
    const currentValue = prev.screenshotFrame?.preset === "soft-glass";
    return {
      ...prev,
      screenshotFrame: {
        ...prev.screenshotFrame,
        preset: currentValue ? "none" : "soft-glass",
      },
    };
  });
}, [setConfig]);
```

**Note**: Handler correctly updates `screenshotFrame.preset`, but CodeSnippet may not be reading this value.

---

## Recommendations

### 1. Fix Container Sizing (HIGH PRIORITY)

**Change required in** `components/looks/CodeSnippet.tsx`:

```tsx
// Current (line 65)
<div className="relative z-10 flex h-full w-full items-center justify-center p-8">

// Should be
<div className="relative z-10 flex h-full w-full items-center justify-center p-6">
// p-6 = 24px padding

// Current (line 84)
padding: 2rem;

// Should be
padding: 1.5rem;  // 24px

// Remove max-width constraint (line 66)
<div className="w-full max-w-4xl">
// Should be
<div className="w-full">  // Or w-auto to fit content
```

### 2. Implement Auto Language Detection (MEDIUM PRIORITY)

**Approach 1**: Check Shiki built-in support
```typescript
// Try using 'auto' or 'text' as language
const html = await codeToHtml(code, {
  lang: language || 'auto',  // Test if Shiki v3 supports this
  theme: theme,
});
```

**Approach 2**: Integrate detection library
```typescript
import { detectLanguage } from 'some-detection-library';

const detectedLang = language || detectLanguage(code);
const html = await codeToHtml(code, {
  lang: detectedLang,
  theme: theme,
});
```

**Approach 3**: Heuristic detection
```typescript
function detectLanguage(code: string): string {
  if (code.includes('function') && code.includes('{')) return 'javascript';
  if (code.includes('def ') && code.includes(':')) return 'python';
  // ... more heuristics
  return 'javascript'; // fallback
}
```

### 3. Fix Effects Tab (HIGH PRIORITY)

**Investigation steps**:
1. Verify CodeSnippet reads `config.screenshotFrame` from useLookPrimitives
2. Check if LookSurface applies screenshot frame styles
3. Ensure effects handlers update correct state path
4. Test each effect toggle independently

**Alternative solution**: Remove effects tab entirely for code-snippet look if effects don't make sense for this look type.

### 4. Remove Effects Tab (IMMEDIATE - Per Requirements)

Since effects are not working and the user requested removal:

**File**: `components/layout-config.tsx:94-103`
- Remove the entire effects AccordionItem block
- Remove from default expansion state (lines 57-59)
- OR conditionally hide for code-snippet look:
  ```tsx
  {config.lookId !== "code-snippet" && (
    <AccordionItem value="effects">...</AccordionItem>
  )}
  ```

---

## Testing Checklist

- [ ] Verify padding is exactly 24px (1.5rem) around code content
- [ ] Test that container grows with code content (add 100+ lines)
- [ ] Confirm padding stays 24px regardless of content size
- [ ] Test automatic language detection with various code samples
- [ ] Verify manual language override still works
- [ ] Test all 9 themes render correctly
- [ ] Verify effects tab is removed or hidden for code-snippet look
- [ ] Test soft glass effect (if keeping effects)
- [ ] Test corners toggle (if keeping effects)
- [ ] Test shadow toggle (if keeping effects)
- [ ] Ensure no console errors with Shiki processing
- [ ] Test fallback behavior when Shiki fails

---

## Dependencies

**Shiki Version**: 3.19.0
- `@shikijs/core@3.19.0`
- `@shikijs/engine-javascript@3.19.0`
- `@shikijs/engine-oniguruma@3.19.0`
- `@shikijs/langs@3.19.0` (language grammars)
- `@shikijs/themes@3.19.0` (syntax themes)
- `@shikijs/types@3.19.0`
- `@shikijs/vscode-textmate@10.0.2`

**State Management**: Jotai (`configAtom` in `hooks/atoms.ts`)

**Styling**:
- Tailwind CSS (utility classes)
- styled-jsx (scoped styles)
- Custom CSS-in-JS for code block styling

---

## Conclusion

The code snippet implementation is functional but has three main issues:

1. **Padding/Sizing**: Uses 32px instead of 24px, and has unnecessary max-width constraint
2. **Language Detection**: Requires manual selection, missing auto-detection capability
3. **Effects Tab**: Present in UI but effects don't apply to code snippet look

**Immediate Actions**:
1. Change padding from `p-8` (32px) to `p-6` (24px)
2. Change code block padding from `2rem` to `1.5rem`
3. Remove or relax max-width constraint to allow content-based sizing
4. Remove effects tab from sidebar (user requested)

**Future Enhancements**:
1. Investigate Shiki auto-detection capabilities
2. Add language detection library if Shiki doesn't support it natively
3. Fix effects implementation or remove capabilities from look definition
