# Research: Page Layout & Sidebar Structure

## Overview

The index page uses a three-level hierarchy: AppHeader → Main Content Area → Two-column workspace. The sidebar is currently nested inside `PlaygroundWorkspace` and starts below the looks rail and variant toggle. Moving it upwards requires restructuring the layout to position it alongside the looks rail.

## Key Files & Locations

| File | Purpose | Key Lines |
|------|---------|-----------|
| `app/page.tsx` | Main page layout orchestration | 68-101 |
| `components/playground-workspace.tsx` | Two-column workspace (preview + sidebar) | 22-83 |
| `components/layout-config.tsx` | Right sidebar with Design/Assets tabs | 71-386 |
| `components/look-selector.tsx` | Horizontal rail for look selection | 36-118 |
| `components/variant-toggle.tsx` | Variant and style pattern controls | 140-287 |

## Architecture & Data Flow

### Current Layout Hierarchy

```
<main> (app/page.tsx:68)
├── <DragOverlay />
├── <AppHeader /> (line 77)
└── <div> Main content container (line 86)
    ├── <LookSelector /> (line 87) ← Looks rail
    └── <PlaygroundWorkspace> (lines 89-100)
        ├── Left column (lines 36-76 in workspace)
        │   ├── <VariantToggle /> (line 38)
        │   ├── Aspect lock button (lines 40-56)
        │   └── <PreviewViewport> (lines 58-74)
        └── Right column: Sidebar (lines 78-80)
            └── <LayoutConfigPanel />
```

### Layout Classes & Positioning

**Main Container** (`page.tsx:86`)
```
className="flex flex-1 min-h-0 flex-col gap-4 px-4 pb-12 pt-4 sm:px-8 sm:pb-10 overflow-hidden"
```
- Uses `flex-col` (vertical stacking)
- Contains both looks rail and workspace

**PlaygroundWorkspace Container** (`playground-workspace.tsx:35`)
```
className={cn("flex flex-1 min-h-0", isMobile ? "flex-col gap-4" : "overflow-hidden")}
```
- Desktop: horizontal flex (row)
- Mobile: vertical flex (col)

**Left Preview Column** (`playground-workspace.tsx:36`)
```
className="flex flex-1 flex-col overflow-hidden bg-background px-2 pb-8 pt-4 sm:px-4 sm:pt-6"
```
- Takes remaining space (`flex-1`)
- Contains variant toggle + preview

**Right Sidebar** (`playground-workspace.tsx:78`)
```
className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col"
```
- Fixed width: `w-80` (320px)
- Hidden on mobile
- Full height within workspace

### Component Responsibilities

**LookSelector** (`look-selector.tsx:36-118`)
- Horizontal scrolling rail of look preview cards
- 160x90px previews with isolated Jotai stores
- Shows "Look" label with Sparkles icon
- Max width: `max-w-4xl`

**VariantToggle** (`variant-toggle.tsx:140-287`)
- Shows variant options (left/center/right/full)
- Shows style controls (none/grain/glow/grid)
- Only renders if multiple variants or gradient background
- Currently at top of preview column

**LayoutConfigPanel** (`layout-config.tsx:71-386`)
- Tab-based: Design and Assets
- Design tab: Text inputs, typography, effects, background
- Assets tab: Screenshot, logo, background uploads
- Scrollable content area (lines 249-383)

## Current Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│ AppHeader                                                │
├─────────────────────────────────────────────────────────┤
│ [Looks Rail]                                            │
│ ┌────────┬────────┬────────┬─────────┐                 │
│ │Preview │Preview │Preview │Preview  │                 │
│ └────────┴────────┴────────┴─────────┘                 │
├─────────────────────────────┬───────────────────────────┤
│ [Variants] [Style]          │ Design | Assets          │
│                             ├───────────────────────────┤
│ [Aspect Lock]               │                           │
│                             │ Headline input            │
│ ┌───────────────────────┐  │                           │
│ │                       │  │ Subtitle input            │
│ │                       │  │                           │
│ │    Preview Canvas     │  │ Typography                │
│ │                       │  │                           │
│ │                       │  │ Effects toggles           │
│ └───────────────────────┘  │                           │
│                             │ Background picker         │
│                             │                           │
└─────────────────────────────┴───────────────────────────┘
```

## Target Visual Structure (Inferred)

User wants sidebar to start at the same vertical position as looks rail:

```
┌─────────────────────────────────────────────────────────┐
│ AppHeader                                                │
├─────────────────────────────┬───────────────────────────┤
│ [Looks Rail]                │ Design | Assets          │
│ ┌────────┬────────┬──────┐ ├───────────────────────────┤
│ │Preview │Preview │...   │ │ Headline input            │
│ └────────┴────────┴──────┘ │                           │
│                             │ Subtitle input            │
│ [Variants] [Style]          │                           │
│                             │ Typography                │
│ [Aspect Lock]               │                           │
│                             │ Effects toggles           │
│ ┌───────────────────────┐  │                           │
│ │    Preview Canvas     │  │ Background picker         │
│ │                       │  │                           │
│ └───────────────────────┘  │                           │
└─────────────────────────────┴───────────────────────────┘
```

## Patterns to Follow

### Component Composition
- Keep components focused on single responsibility
- Pass `onUploadAsset` callback through component tree
- Use Jotai atoms for state management (configAtom, assetsAtom)

### Responsive Design
- Sidebar hidden on mobile (`hidden sm:flex`)
- Mobile uses sheet/drawer pattern (`MobileActions`)
- Max width constraints on content (`max-w-4xl`)

### Styling Conventions
- Tailwind utility classes, no custom CSS
- Border colors: `border-border`
- Background layers: `bg-background`, `bg-muted/20`, `bg-muted/30`
- Spacing: `gap-4`, `gap-3` for sections
- Padding: `px-4 py-4` standard, `sm:px-8` on larger screens

## Implementation Considerations

### To Move Sidebar Upwards

1. **Extract sidebar from PlaygroundWorkspace**
   - Move `LayoutConfigPanel` out of workspace component
   - Lift it to page-level layout in `page.tsx`

2. **Restructure main content area**
   - Change from single-column (`flex-col`) to two-column layout
   - Left column: looks rail + variant toggle + preview (stacked vertically)
   - Right column: sidebar (fixed 320px width)

3. **Adjust responsive behavior**
   - Maintain mobile drawer pattern for sidebar
   - Ensure looks rail remains full-width above workspace
   - Or make looks rail part of left column only

4. **Update component props**
   - `PlaygroundWorkspace` no longer renders sidebar
   - Remove `onUploadAsset` prop if not needed elsewhere
   - Keep preview-related props only

### Key Challenges

1. **Layout complexity**: Need to decide if looks rail spans full width or just left column
2. **Scroll behavior**: Sidebar should scroll independently, preview column might need scroll too
3. **Height coordination**: Both columns need proper min-h-0 and flex-1 for overflow handling
4. **Mobile transition**: Ensure mobile layout still works with new structure

## Recommendations

### Approach A: Looks Rail Spans Full Width
- Keep looks rail outside two-column layout
- Two-column layout contains: (preview column | sidebar)
- Simpler, maintains current looks rail behavior

### Approach B: Looks Rail in Left Column Only
- Two-column layout at top level: (left column | sidebar)
- Left column contains: looks rail + preview
- More integrated, sidebar truly starts at same level
- Requires looks rail width adjustment

**Recommended: Approach A** - Less disruptive, clearer separation of concerns, easier to maintain responsive behavior.

## Code Examples

### Current Page Layout (page.tsx:86-101)

```86:101:app/page.tsx
      <div className="flex flex-1 min-h-0 flex-col gap-4 px-4 pb-12 pt-4 sm:px-8 sm:pb-10 overflow-hidden">
        <LookSelector />

          <PlaygroundWorkspace
            isMobile={isMobile}
            onVariantChange={handleVariantChange}
            shouldShowAspectLock={shouldShowAspectLock}
            isAspectLocked={isAspectLocked}
            onToggleAspect={toggleCanvasMode}
            canvasHeight={canvas.height}
          canvasWidth={canvas.width}
          isAnalyzingColors={isAnalyzingColors}
          onUploadAsset={handleFileProcess}
          showFocusHint={showFocusHint}
        />
      </div>
```

### Current Workspace Structure (playground-workspace.tsx:34-82)

```34:82:components/playground-workspace.tsx
  return (
    <div className={cn("flex flex-1 min-h-0", isMobile ? "flex-col gap-4" : "overflow-hidden")}>
      <div className="flex flex-1 flex-col overflow-hidden bg-background px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <VariantToggle onVariantChange={onVariantChange} />

          {shouldShowAspectLock ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onToggleAspect}
                aria-pressed={isAspectLocked}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                  isAspectLocked
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                )}
              >
                {isAspectLocked ? "Locked · 16:9" : "Lock to 16:9"}
              </button>
            </div>
          ) : null}

          <div className="relative flex w-full justify-center">
            <PreviewViewport
              surfaceWidth={canvasWidth}
              surfaceHeight={canvasHeight}
              isLoading={isAnalyzingColors}
              loadingText="Analyzing colors..."
            >
              <CoverPreview onUploadAsset={onUploadAsset} />
            </PreviewViewport>
            {showFocusHint ? (
              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                <span className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80 shadow-sm ring-1 ring-border/70">
                  Screenshot-focused variant active
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col">
        <LayoutConfigPanel onUploadAsset={onUploadAsset} />
      </div>
    </div>
  );
```

### Sidebar Structure (layout-config.tsx:204-250)

```204:250:components/layout-config.tsx
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-4">
      {/* Tab Header */}
      <div
        role="tablist"
        aria-label="Configuration options"
        className="flex border-b border-border"
      >
        <button
          type="button"
          role="tab"
          id="tab-design"
          aria-selected={activeTab === "design"}
          aria-controls="tabpanel-design"
          tabIndex={activeTab === "design" ? 0 : -1}
          onClick={() => setActiveTab("design")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "design"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Design
        </button>
        <button
          type="button"
          role="tab"
          id="tab-assets"
          aria-selected={activeTab === "assets"}
          aria-controls="tabpanel-assets"
          tabIndex={activeTab === "assets" ? 0 : -1}
          onClick={() => setActiveTab("assets")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "assets"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Assets
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
```




