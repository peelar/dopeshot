# Memory/Export History Button - Progressive Disclosure UX Plan

## Problem Statement

The "My Exports" menu item in the user dropdown doesn't provide intuitive UX:
- Users don't expect a sidebar to open from a menu item
- The feature has discoverability issues - a small icon button might go unnoticed
- Need to balance visibility with not cluttering the UI

## Solution: Progressive Disclosure Pattern

Reveal the history button when it becomes relevant (after first export), using subtle visual cues to guide users.

---

## User Flow

### 1. Initial State (No Exports Yet)
- **Button**: Small, subtle History icon button in the left column
- **Styling**: Outline style, muted/ghost appearance
- **Visibility**: Present but unobtrusive
- **State**: `hasExports: false`, `hasUnseenExports: false`

### 2. First Export Event
- **Trigger**: User successfully exports their first image
- **Animation**: Brief pulse/glow effect on history button (1-2 seconds)
- **Badge**: Small colored dot indicator appears
- **Optional**: Tiny tooltip shows: "Saved to history" (auto-dismisses after 3s)
- **State Update**: `hasExports: true`, `hasUnseenExports: true`

### 3. User Opens History
- **Action**: Clicks history button → sidebar slides in from left
- **Badge**: Dot indicator disappears
- **State Update**: `hasUnseenExports: false`, `lastViewedTimestamp: Date.now()`

### 4. Subsequent Exports
- **Badge**: Dot reappears when new exports added since last view
- **Count**: Optional - show number badge instead of dot if >1 unseen
- **Button**: Stays filled/active style once user has exports

---

## Technical Implementation

### A. State Management (Jotai Atoms)

**New atoms needed:**
```typescript
// src/hooks/atoms/memory.ts

// Track if user has any exports
export const hasExportsAtom = atom(false);

// Track if there are unseen exports
export const hasUnseenExportsAtom = atom(false);

// Track when user last viewed history
export const lastViewedHistoryAtom = atom<number | null>(null);

// Derived: count of unseen exports
export const unseenExportCountAtom = atom((get) => {
  const items = get(memoryItemsAtom);
  const lastViewed = get(lastViewedHistoryAtom);

  if (!lastViewed) return items.length;

  return items.filter(item =>
    new Date(item.createdAt).getTime() > lastViewed
  ).length;
});
```

### B. Button Component Updates

**File**: `src/components/memory/memory-sidebar-trigger.tsx`

**Changes needed:**
1. Read `hasExportsAtom` and `unseenExportCountAtom`
2. Add badge indicator (dot or count)
3. Add pulse animation on first export
4. Change styling based on `hasExports` state
5. Update `lastViewedHistoryAtom` when sidebar opens

**Visual states:**
- **No exports**: Ghost/outline style, muted opacity (0.6)
- **Has exports**: Filled icon, normal opacity
- **Has unseen**: Badge dot/count visible
- **Just exported**: Pulse animation (keyframes)

### C. Button Placement

**Current location**: Not currently placed (was in user menu)

**New location**: Fixed position on the left side (no layout disruption)

**File to modify**: `src/app/(playground)/_components/playground-page.tsx`

**Implementation approach:**
Use `position: fixed` so the button floats on the left without affecting the existing layout flow.

**Options:**

**Option A: Top-left, below header**
```tsx
{/* Memory button - fixed position */}
<MemorySidebarTrigger className="fixed left-4 top-20 z-40" />
```
- Position: `left-4` (16px from left), `top-20` (below header ~80px)
- Z-index: `z-40` (above content, below modals)
- No layout shift since it's taken out of flow

**Option B: Mid-left, vertically centered**
```tsx
{/* Memory button - fixed position */}
<MemorySidebarTrigger className="fixed left-4 top-1/2 -translate-y-1/2 z-40" />
```
- Position: Centered vertically on left edge
- Always visible regardless of scroll

**Option C: Bottom-left corner (FAB style)**
```tsx
{/* Memory button - fixed position */}
<MemorySidebarTrigger className="fixed bottom-6 left-4 z-40" />
```
- Position: Bottom-left, floats like a floating action button
- Familiar mobile pattern

**✅ SELECTED: Option A** (top-left below header)
- Most discoverable
- Natural position for "history/navigation" controls
- Doesn't conflict with other UI elements

**Implementation:**
```tsx
{/* Memory button - fixed position, top-left below header */}
<MemorySidebarTrigger className="fixed left-4 top-20 z-40" />
```

**Positioning details:**
- `fixed`: Takes element out of document flow (no layout shift)
- `left-4`: 16px from left edge (1rem spacing)
- `top-20`: 80px from top (~14px header height + spacing)
- `z-40`: Above main content (z-30), below modals/dropdowns (z-50)

### D. Export Flow Integration

**File**: `src/hooks/use-playground-controller.ts` (or wherever export happens)

**After successful export:**
```typescript
const handleExport = async () => {
  // ... existing export logic ...

  // After successful export:
  setHasExportsAtom(true);
  setHasUnseenExportsAtom(true);

  // Trigger animation (via atom or event)
  triggerHistoryButtonHighlight();

  track("export_completed", { firstExport: !hasExports });
};
```

### E. Persistence

**Store in localStorage:**
```typescript
// src/lib/storage/memory-state.ts

export function getMemoryState() {
  return {
    lastViewed: localStorage.getItem('memory_last_viewed'),
    hasExports: localStorage.getItem('memory_has_exports') === 'true'
  };
}

export function setMemoryState(state: { lastViewed?: number, hasExports?: boolean }) {
  if (state.lastViewed !== undefined) {
    localStorage.setItem('memory_last_viewed', state.lastViewed.toString());
  }
  if (state.hasExports !== undefined) {
    localStorage.setItem('memory_has_exports', state.hasExports.toString());
  }
}
```

**Initialize atoms from localStorage on mount**

---

## Visual Design Specs

### Button States

**1. Empty State (no exports)**
```css
opacity: 0.5
color: muted-foreground
background: transparent
border: 1px solid border (if showing border)
icon: outline version
```

**2. Has Exports State**
```css
opacity: 1
color: foreground
background: muted/20 on hover
icon: filled version
```

**3. Badge Indicator**
```css
position: absolute
top: -2px
right: -2px
width: 8px
height: 8px
border-radius: 50%
background: primary or destructive (red/orange)
border: 2px solid background (for contrast)
```

**4. Badge with Count** (optional)
```css
Same as dot but:
width/height: auto
padding: 2px 4px
font-size: 10px
min-width: 16px
```

**5. Pulse Animation** (on first export)
```css
@keyframes memory-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(primary, 0.7);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(primary, 0);
    transform: scale(1.05);
  }
}

animation: memory-pulse 1s ease-out 2; // Play twice
```

### Tooltip (optional)
```tsx
<Tooltip>
  <TooltipTrigger>
    <MemorySidebarTrigger />
  </TooltipTrigger>
  <TooltipContent>
    {hasExports ? 'View export history' : 'Export history (empty)'}
  </TooltipContent>
</Tooltip>
```

---

## Implementation Steps

### Phase 1: Setup & State
1. [ ] Create new atoms for `hasExports`, `hasUnseenExports`, `lastViewedHistory` in `src/hooks/atoms/memory.ts`
2. [ ] Add localStorage persistence helpers in `src/lib/storage/memory-state.ts`
3. [ ] Update `memory-sidebar-trigger.tsx` component to read new atoms

### Phase 2: Button Placement ✅ USING OPTION A
4. [ ] Add `<MemorySidebarTrigger className="fixed left-4 top-20 z-40" />` to `playground-page.tsx`
5. [ ] Test positioning on desktop (should be 16px from left, 80px from top)
6. [ ] Test positioning on mobile (may need responsive classes)
7. [ ] Remove "My Exports" menu item from `user-menu.tsx`

### Phase 3: Visual States
8. [ ] Add ghost state styling: `opacity-50` when `!hasExports`
9. [ ] Add filled state styling: `opacity-100` when `hasExports`
10. [ ] Create badge dot indicator (absolute positioned, 8px circle, primary color)
11. [ ] Add badge count variant (if `unseenCount > 1`)
12. [ ] Create pulse animation keyframes in component or global CSS
13. [ ] Add animation trigger class when `shouldPulse` state is true

### Phase 4: Integration
14. [ ] Find export completion handler (likely in `use-playground-controller.ts`)
15. [ ] Add `setHasExports(true)` and `setHasUnseenExports(true)` after successful export
16. [ ] Trigger pulse animation on first export only
17. [ ] Update `lastViewedHistory` timestamp when sidebar opens
18. [ ] Calculate `unseenExportCount` from `memoryItemsAtom` + `lastViewedHistory`

### Phase 5: Polish & Testing
19. [ ] Test flow: new user → export → button highlights → click → sidebar opens
20. [ ] Test flow: returning user → new export → badge appears
21. [ ] Test localStorage: close tab → reopen → state persists
22. [ ] Add analytics: `memory_button_first_export`, `memory_button_clicked`
23. [ ] Test mobile: button doesn't overlap with other UI elements
24. [ ] Add tooltip (optional): "Export history" on hover
25. [ ] Verify button is visible when memory sidebar is open

---

## Analytics Events

Track these events:
- `memory_button_first_seen` - When user has 0 exports and button is visible
- `memory_first_export_completed` - First export triggers highlight
- `memory_button_clicked_with_badge` - User clicks with unseen exports
- `memory_button_clicked_no_badge` - User clicks without unseen exports
- `memory_sidebar_opened_from_button` - Sidebar opened via button click

---

## Edge Cases

1. **User exports, then refreshes before viewing**
   - localStorage preserves `hasExports = true`
   - Badge still shows on reload

2. **User clears localStorage**
   - Atoms fall back to default (false)
   - Check server for actual export count on mount

3. **Multiple exports in quick succession**
   - Don't spam pulse animation
   - Debounce or only show on very first export ever

4. **User exports while sidebar is open**
   - Update items in real-time
   - No badge since they're already viewing

5. **Server-side exports** (future)
   - Fetch export count on mount
   - Set `hasExports` based on actual data

---

## Future Enhancements

- **Smart notifications**: "You have 5 exports ready to share"
- **Export categories**: Badge color based on export type
- **Keyboard shortcut**: `Cmd+H` to toggle history
- **Empty state CTA**: When button clicked with no exports, show helpful message
- **Badge animation**: Subtle bounce when new export added

---

## Open Questions

1. **Exact button placement**: Top of left column vs bottom-left floating?
2. **Badge style**: Simple dot vs count number?
3. **Animation intensity**: Subtle pulse vs more prominent?
4. **Tooltip**: Always show or only on hover/long-press?
5. **Mobile**: Same placement or move to header/bottom nav?

---

## Success Metrics

- % of users who discover history button after first export
- Time between first export and first history view
- % of users who return to history after initial discovery
- Reduction in "how do I find my exports?" support questions
