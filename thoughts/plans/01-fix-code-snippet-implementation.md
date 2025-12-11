# Implementation Plan: Fix Code Snippet Look Issues

## Overview

This plan addresses three critical issues with the code snippet look implementation:
1. **Container sizing**: Fix padding from 32px to 24px and make container content-adaptive
2. **Auto language detection**: Configure Shiki to automatically detect code language when possible
3. **Remove effects tab**: Effects don't work for code snippets, so remove the tab from UI

## Implementation Approach

We'll tackle these issues in phases:
- **Phase 1**: Fix container padding and sizing (most visible issue)
- **Phase 2**: Remove effects tab from code snippet look
- **Phase 3**: Implement automatic language detection with Shiki
- **Phase 4**: Testing and verification

This approach prioritizes visible UI fixes first, then moves to UX improvements. Each phase can be verified independently before moving to the next.

---

## Phase 1: Fix Container Padding and Sizing

### Changes Required

#### 1. CodeSnippet Component - Update Container Padding

**File**: `components/looks/CodeSnippet.tsx`
**Lines**: 65, 66, 84

**Current code (Line 65)**:
```tsx
<div className="relative z-10 flex h-full w-full items-center justify-center p-8">
  <div className="w-full max-w-4xl">
```

**Updated code**:
```tsx
<div className="relative z-10 flex h-full w-full items-center justify-center p-6">
  <div className="w-full">
```

**Changes**:
- Change `p-8` to `p-6` (32px → 24px padding)
- Remove `max-w-4xl` constraint to allow content-based sizing

**Current code (Line 84)**:
```tsx
.code-snippet :global(pre) {
  margin: 0;
  padding: 2rem;
  font-size: 0.95rem;
  line-height: 1.6;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace;
}
```

**Updated code**:
```tsx
.code-snippet :global(pre) {
  margin: 0;
  padding: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace;
}
```

**Changes**:
- Change `padding: 2rem` to `padding: 1.5rem` (32px → 24px internal padding)

### Success Criteria

#### Automated Verification
```bash
# Build passes
bun run build

# Type checking passes
bun run typecheck
```

#### Manual Verification
- [ ] Container padding is visually 24px (not 32px)
- [ ] Code block internal padding is 24px
- [ ] Container width adapts to code content without max-width constraint
- [ ] Small code snippets (3-5 lines) render with minimal wrapping
- [ ] Large code snippets (50+ lines) expand container while maintaining 24px padding
- [ ] No layout breaks or overflow issues

---

## Phase 2: Remove Effects Tab from Code Snippet Look

### Changes Required

#### 1. Layout Config - Conditionally Hide Effects Tab

**File**: `components/layout-config.tsx`
**Lines**: 57-59, 94-103

**Current code (Lines 57-59)**:
```tsx
const defaultAccordionValues = showCodeSection
  ? ["code", "effects", "background"]
  : ["look", "effects", "background"];
```

**Updated code**:
```tsx
const defaultAccordionValues = showCodeSection
  ? ["code", "background"]
  : ["look", "effects", "background"];
```

**Changes**:
- Remove `"effects"` from default expansion for code snippet look

**Current code (Lines 94-103)**:
```tsx
<AccordionItem value="effects" className="border-b">
  <AccordionTrigger className="px-4 py-3 hover:no-underline">
    <div className="flex w-full items-center justify-between pr-4">
      <span className="text-sm font-semibold">Effects</span>
    </div>
  </AccordionTrigger>
  <AccordionContent className="px-4 pb-4">
    <EffectsSection />
  </AccordionContent>
</AccordionItem>
```

**Updated code**:
```tsx
{!showCodeSection && (
  <AccordionItem value="effects" className="border-b">
    <AccordionTrigger className="px-4 py-3 hover:no-underline">
      <div className="flex w-full items-center justify-between pr-4">
        <span className="text-sm font-semibold">Effects</span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="px-4 pb-4">
      <EffectsSection />
    </AccordionContent>
  </AccordionItem>
)}
```

**Changes**:
- Wrap effects accordion item with conditional: `{!showCodeSection && (...)}`
- Effects tab will only show for non-code-snippet looks

### Success Criteria

#### Automated Verification
```bash
# Build passes
bun run build

# Type checking passes
bun run typecheck
```

#### Manual Verification
- [ ] Effects tab is NOT visible when code snippet look is selected
- [ ] Effects tab IS visible for other looks (Peak, Spotlight, Backdrop)
- [ ] Sidebar accordion works correctly without effects section
- [ ] Code section expands by default when switching to code snippet look
- [ ] No console errors or React warnings

---

## Phase 3: Implement Automatic Language Detection

### Research: Shiki Auto-Detection Capabilities

Before implementation, we need to verify if Shiki v3.19.0 supports automatic language detection. According to the research, three possible approaches:

1. **Built-in Shiki detection** - Check if `lang: 'auto'` or `lang: 'text'` works
2. **External library** - Use a package like `highlight.js/lib/languages` for detection
3. **Heuristic detection** - Implement simple pattern matching

### Changes Required

#### 1. Test Shiki Built-in Auto-Detection (Preferred)

**File**: `components/looks/CodeSnippet.tsx`
**Lines**: 32-35

**Test code**:
```tsx
const html = await codeToHtml(code, {
  lang: language || 'text',  // Try 'text' as fallback
  theme: theme,
});
```

If this works without errors, it's the simplest solution. If not, proceed to approach 2.

#### 2. Implement Heuristic Language Detection (Fallback)

**File**: `components/looks/CodeSnippet.tsx`
**Add new function before component**:

```tsx
/**
 * Detect programming language from code content using simple heuristics
 * Fallback: returns 'text' if no match found
 */
function detectLanguage(code: string): string {
  const trimmed = code.trim();

  // JavaScript/TypeScript patterns
  if (/^(import|export)\s/.test(trimmed) || /\b(const|let|var)\s+\w+\s*=/.test(trimmed)) {
    if (/:\s*(string|number|boolean|any|void)/.test(trimmed) || /interface\s+\w+/.test(trimmed)) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Python patterns
  if (/^(def|class|import|from)\s/.test(trimmed) || /^\s{0,4}(if|for|while)\s+.*:/.test(trimmed)) {
    return 'python';
  }

  // HTML patterns
  if (/^<!DOCTYPE html>|^<html|^<\w+[^>]*>/.test(trimmed)) {
    return 'html';
  }

  // CSS patterns
  if (/^[.#\w\s]+\{[\s\S]*\}/.test(trimmed) || /@media|@keyframes/.test(trimmed)) {
    return 'css';
  }

  // JSON patterns
  if (/^\{[\s\S]*\}$|^\[[\s\S]*\]$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Markdown patterns
  if (/^#{1,6}\s/.test(trimmed) || /\[.*\]\(.*\)/.test(trimmed)) {
    return 'markdown';
  }

  // Java patterns
  if (/\b(public|private|protected)\s+(class|interface|enum)/.test(trimmed)) {
    return 'java';
  }

  // Go patterns
  if (/^package\s+\w+|func\s+\w+\(/.test(trimmed)) {
    return 'go';
  }

  // Rust patterns
  if (/^(use\s+\w+|fn\s+\w+|pub\s+fn)/.test(trimmed) || /\blet\s+mut\s/.test(trimmed)) {
    return 'rust';
  }

  // SQL patterns
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return 'sql';
  }

  // Shell/Bash patterns
  if (/^#!\/bin\/(ba)?sh|^\$\s+/.test(trimmed) || /^(echo|cd|ls|mkdir)\s/.test(trimmed)) {
    return 'bash';
  }

  // Ruby patterns
  if (/^(require|class|module|def)\s/.test(trimmed) || /\bend\s*$/.test(trimmed)) {
    return 'ruby';
  }

  // PHP patterns
  if (/^<\?php/.test(trimmed)) {
    return 'php';
  }

  // C++ patterns
  if (/#include\s*<|using namespace|std::/.test(trimmed)) {
    return 'cpp';
  }

  // C# patterns
  if (/\b(namespace|using)\s+\w+;/.test(trimmed) || /\[[\w.]+\]/.test(trimmed)) {
    return 'csharp';
  }

  // YAML patterns
  if (/^\w+:\s*$|^\s{2,}\w+:/.test(trimmed)) {
    return 'yaml';
  }

  // Default fallback
  return 'text';
}
```

#### 3. Update Shiki Call to Use Detection

**File**: `components/looks/CodeSnippet.tsx`
**Lines**: 24-35

**Current code**:
```tsx
const language = config.code?.language || "javascript";

useEffect(() => {
  let isMounted = true;

  async function highlightCode() {
    try {
      const html = await codeToHtml(code, {
        lang: language,
        theme: theme,
      });
```

**Updated code**:
```tsx
const configuredLanguage = config.code?.language;
const detectedLanguage = configuredLanguage || detectLanguage(code);

useEffect(() => {
  let isMounted = true;

  async function highlightCode() {
    try {
      const html = await codeToHtml(code, {
        lang: detectedLanguage,
        theme: theme,
      });
```

**Changes**:
- Add language detection when no language is explicitly configured
- Manual language selection still overrides auto-detection
- Fallback to 'text' if detection fails

#### 4. Update Dependency Array

**File**: `components/looks/CodeSnippet.tsx`
**Line**: 54

**Current code**:
```tsx
}, [code, language, theme]);
```

**Updated code**:
```tsx
}, [code, detectedLanguage, theme]);
```

### Success Criteria

#### Automated Verification
```bash
# Build passes
bun run build

# Type checking passes
bun run typecheck

# No runtime errors
bun run dev
```

#### Manual Verification
- [ ] Auto-detection works for JavaScript code without manual selection
- [ ] Auto-detection works for Python code
- [ ] Auto-detection works for HTML/CSS
- [ ] Auto-detection works for JSON
- [ ] Manual language selection overrides auto-detection
- [ ] Fallback to plain text for unrecognized code
- [ ] No console errors during language detection
- [ ] Syntax highlighting applies correctly for detected languages
- [ ] All 19 supported languages still work with manual selection

**Test Cases**:

1. **JavaScript detection**:
```javascript
const hello = () => {
  console.log("Hello!");
};
```

2. **Python detection**:
```python
def hello():
    print("Hello!")
```

3. **HTML detection**:
```html
<!DOCTYPE html>
<html>
  <body>Hello</body>
</html>
```

4. **TypeScript detection**:
```typescript
interface User {
  name: string;
}
```

5. **JSON detection**:
```json
{
  "name": "test",
  "value": 123
}
```

---

## Phase 4: Testing and Verification

### Comprehensive Testing

#### Visual Testing
- [ ] Open code snippet look
- [ ] Paste small code snippet (5 lines) - verify minimal wrapping with 24px padding
- [ ] Paste large code snippet (100 lines) - verify container grows, padding stays 24px
- [ ] Test horizontal scrolling with long lines (200+ characters)
- [ ] Verify effects tab is not visible
- [ ] Switch to other looks (Peak, Spotlight) - verify effects tab appears
- [ ] Switch back to code snippet - verify effects tab disappears

#### Language Detection Testing
- [ ] Paste JavaScript code without selecting language - verify auto-detection
- [ ] Paste Python code without selecting language - verify auto-detection
- [ ] Paste TypeScript code without selecting language - verify auto-detection
- [ ] Paste HTML code without selecting language - verify auto-detection
- [ ] Paste invalid/unknown code - verify fallback to plain text
- [ ] Manually select language - verify manual selection overrides auto-detection

#### Theme Testing
- [ ] Test all 9 themes with auto-detected code
- [ ] Verify themes apply correctly to detected languages
- [ ] Switch themes dynamically - verify re-highlighting works

#### Regression Testing
- [ ] Background gradients still work
- [ ] Code editing in sidebar updates preview
- [ ] Screenshot export works correctly
- [ ] No console errors or warnings
- [ ] Performance is acceptable (no lag when typing code)

### Success Criteria

#### Automated Verification
```bash
# Full build and type check
bun run build
bun run typecheck

# Run development server without errors
bun run dev
```

#### Manual Verification
- [ ] All Phase 1 criteria pass
- [ ] All Phase 2 criteria pass
- [ ] All Phase 3 criteria pass
- [ ] All regression tests pass
- [ ] No visual regressions compared to original implementation
- [ ] Code snippet look is production-ready

---

## Rollback Plan

If any phase fails or introduces regressions:

### Phase 1 Rollback
Revert `components/looks/CodeSnippet.tsx`:
- Change `p-6` back to `p-8`
- Re-add `max-w-4xl` constraint
- Change `padding: 1.5rem` back to `padding: 2rem`

### Phase 2 Rollback
Revert `components/layout-config.tsx`:
- Remove conditional `{!showCodeSection && (...)}`
- Re-add `"effects"` to default accordion values for code snippet

### Phase 3 Rollback
Revert `components/looks/CodeSnippet.tsx`:
- Remove `detectLanguage` function
- Change back to `const language = config.code?.language || "javascript"`
- Restore original dependency array `[code, language, theme]`

### Complete Rollback
```bash
# Reset file changes
git checkout components/looks/CodeSnippet.tsx
git checkout components/layout-config.tsx

# Verify build
bun run build
```

---

## Dependencies

No new dependencies required. Using existing:
- **Shiki** v3.19.0 (already installed)
- **Tailwind CSS** (already configured)
- **Jotai** (state management, already installed)

---

## Notes

### Why This Approach?

1. **Phased implementation** allows testing each change independently
2. **No breaking changes** - all modifications are backwards-compatible
3. **Progressive enhancement** - language detection doesn't break manual selection
4. **Minimal code changes** - leveraging existing infrastructure

### Future Enhancements (Out of Scope)

- Line numbers toggle
- Line highlighting capability
- Tab size configuration
- Word wrap toggle
- Copy code button
- Export code snippet as image
- Additional theme customization

### Performance Considerations

- Language detection runs on every code change (debouncing could improve performance)
- Shiki highlighting is already async (no additional performance impact)
- Heuristic detection is fast (regex-based, < 1ms execution time)

---

## Timeline Estimate

- **Phase 1**: 15-30 minutes (simple CSS/class changes)
- **Phase 2**: 10-15 minutes (conditional rendering)
- **Phase 3**: 30-45 minutes (language detection implementation and testing)
- **Phase 4**: 30-60 minutes (comprehensive testing)

**Total**: ~2 hours including testing and verification
