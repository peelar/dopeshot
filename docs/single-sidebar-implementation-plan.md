# Single Sidebar Implementation Plan

## Vision

Replace the two-tab sidebar (Assets/Design) with a single collapsible sidebar that follows a natural top-to-bottom workflow. Maintain simplicity through strong defaults, progressive disclosure, and smart collapsing behavior.

## Core Principles

### 1. Strong Defaults First
- Auto-select the best gradient from screenshot colors
- Auto-position logo intelligently
- Pre-select the most popular look
- Users get a great result with zero configuration

### 2. Not Overwhelming
- Only 1-2 sections expanded at a time
- Opening a section auto-collapses others (accordion behavior)
- Hide advanced controls behind "Refine" or "Advanced" toggles
- Visual hierarchy: large titles, clear sections

### 3. Progressive Disclosure
- Essential controls visible by default
- Advanced options hidden until needed
- Empty states guide users to next action
- Success states collapse automatically

### 4. Workflow Order
- Mirrors natural design process: content → canvas → style → polish
- Each step builds on the previous
- Can jump around, but default flow is top-to-bottom

---

## Sidebar Structure

### Layout Overview

```
┌─ Sidebar (320px wide) ────────────────┐
│                                        │
│  ▼ Screenshot                         │
│     [Large preview thumbnail]          │
│     [Zoom slider: ──●── 100%]         │
│     [Replace]                          │
│                                        │
│  ▶ Logo                               │
│                                        │
│  ▶ Background                         │
│                                        │
│  ▶ Look & Layout                      │
│                                        │
│  ▶ Colors                             │
│                                        │
│  ▶ Effects                            │
│                                        │
└────────────────────────────────────────┘
```

### Section-by-Section Breakdown

---

#### 1. Screenshot Section

**Expanded by default when:** No screenshot uploaded (empty state)
**Auto-collapses when:** Screenshot uploaded successfully

**Empty State:**
```
▼ Screenshot
  ┌──────────────────────────────────┐
  │  ┌─────────────────────────────┐ │
  │  │      [Upload Icon]          │ │
  │  │   Drop screenshot here      │ │
  │  │   or click to browse        │ │
  │  │                             │ │
  │  │   PNG, JPG, SVG up to 10MB  │ │
  │  └─────────────────────────────┘ │
  └──────────────────────────────────┘
```

**Filled State:**
```
▶ Screenshot
  [Compact preview thumbnail]
  Zoom: 100%
```

**Expanded Filled State:**
```
▼ Screenshot
  ┌──────────────────────────────────┐
  │  [Large preview thumbnail]       │
  │  with subtle hover overlay:      │
  │  "Click to replace"              │
  └──────────────────────────────────┘

  Zoom
  [────────●────────] 100%

  [Replace Screenshot]
```

**Controls:**
- Preview thumbnail (click to replace)
- Zoom slider (1-200%, default 100%)
- Replace button (explicit action)

**Smart Behavior:**
- After upload, auto-collapse and expand Background section
- If user manually expands, remember their preference for session
- Show loading spinner during color analysis

---

#### 2. Logo Section

**Expanded by default when:** Screenshot uploaded but no logo (if look supports logos)
**Auto-collapses when:** Logo uploaded or user skips to next section

**Empty State:**
```
▼ Logo
  ┌──────────────────────────────────┐
  │  [Upload Icon]                   │
  │  Add your logo (optional)        │
  │  PNG, SVG recommended            │
  └──────────────────────────────────┘

  [Skip this step →]
```

**Filled State:**
```
▶ Logo
  [Compact preview thumbnail]
```

**Expanded Filled State:**
```
▼ Logo
  ┌──────────────────────────────────┐
  │  [Preview thumbnail]             │
  └──────────────────────────────────┘

  [Replace Logo] [Remove]
```

**Smart Behavior:**
- If look doesn't support logo, hide this section entirely
- After upload, auto-collapse and expand Background section
- "Skip this step" button expands Background section

---

#### 3. Background Section

**Expanded by default when:** Screenshot uploaded (with or without logo)
**This is where users make their first creative decision**

**Default State (Gradient auto-applied):**
```
▼ Background
  ┌──────────────────────────────────┐
  │  [Large preview of current bg]   │
  │  (Shows actual gradient/image)   │
  └──────────────────────────────────┘

  [Gradient] [Image] [AI ✨]

  ──── Gradient ────

  From Screenshot (4 auto-generated options)
  ┌────┐ ┌────┐ ┌────┐ ┌────┐
  │ ✓  │ │    │ │    │ │    │  ← Click to switch
  └────┘ └────┘ └────┘ └────┘

  [▶ More options]
```

**"More options" expanded:**
```
  ──── Gradient ────

  • From Screenshot
    [4 swatches in grid]

  • Presets
    [8 preset swatches in grid]

  • Custom
    Start:  [██ Color picker]
    Middle: [██ Color picker]
    End:    [██ Color picker]
    Angle:  [────●────] 135°
```

**Image Type Selected:**
```
  [Gradient] [Image] [AI ✨]

  ──── Image ────

  ┌──────────────────────────────────┐
  │  [Upload Icon]                   │
  │  Upload background image         │
  │  High resolution recommended     │
  └──────────────────────────────────┘
```

**AI Type Selected:**
```
  [Gradient] [Image] [AI ✨]

  ──── AI Generated ────

  [Generate Background]

  Styled automatically from your
  screenshot colors

  ──── or ────

  [▶ Customize style]
```

**AI - After Generation:**
```
  ──── AI Generated ────

  ┌──────────────────────────────────┐
  │  [Generated background preview]  │
  └──────────────────────────────────┘

  Abstract shapes in blues and oranges

  [↻ Regenerate] [⚙ Refine Style]

  3/5 generations remaining this session
```

**AI - Refine Modal (separate modal, not inline):**
```
┌─ Refine AI Background ──────────────┐
│                                      │
│ Style Preset                         │
│ ( ) Abstract Shapes                  │
│ (•) Geometric Patterns               │
│ ( ) Flowing Gradients                │
│ ( ) Particle System                  │
│                                      │
│ Complexity                           │
│ Simple [──────●─────] Complex        │
│                                      │
│ Color Source                         │
│ (•) From Screenshot                  │
│ ( ) Custom Palette                   │
│                                      │
│           [Cancel] [Generate]        │
└──────────────────────────────────────┘
```

**Smart Behavior:**
- Auto-select best gradient from screenshot on upload
- Show "More options" collapsed by default (4 swatches is enough)
- Type switcher (Gradient/Image/AI) persists across sections
- AI shows remaining generations count
- After AI generation, don't auto-collapse (let user admire result)

---

#### 4. Look & Layout Section

**Expanded by default when:** Background selected
**Auto-collapses when:** Look selected

**Default State:**
```
▶ Look & Layout
  Currently: Popup Gradient
```

**Expanded State:**
```
▼ Look & Layout

  Look Style
  ┌────┐ ┌────┐ ┌────┐
  │ ✓  │ │    │ │    │  ← Visual previews
  └────┘ └────┘ └────┘
  Popup   Hero   Adaptive

  [View all looks →]

  ──────────────────

  Text (optional)
  [Text editor with character count]

  Max length: 120 characters
```

**Smart Behavior:**
- Show top 3 most popular looks by default
- "View all looks" opens modal with full grid
- Text editor only shows if look supports text
- Character limit based on look (some looks work better with short text)

---

#### 5. Colors Section

**Expanded by default when:** Never (optional styling)
**User must manually expand**

**Collapsed State:**
```
▶ Colors
  Using colors from screenshot
```

**Expanded State:**
```
▼ Colors

  ✨ Suggested Palettes (from screenshot)
  ┌────┐ ┌────┐ ┌────┐
  │ ●● │ │ ●● │ │ ●● │
  │ ●● │ │ ●● │ │ ●● │
  └────┘ └────┘ └────┘
  Click to apply

  ──── or ────

  Custom Colors
  Background: [██ Color picker]
  Accent:     [██ Color picker]
  Text:       [██ Color picker]
```

**Smart Behavior:**
- Auto-generate 3 color palettes from screenshot (complementary, analogous, triadic)
- Show current colors in collapsed state
- One-click palette application
- Custom colors only for advanced users

---

#### 6. Effects Section

**Expanded by default when:** Never (optional polish)
**User must manually expand**

**Collapsed State:**
```
▶ Effects
  Grain: On, Glow: Off
```

**Expanded State:**
```
▼ Effects

  Pattern Overlay
  [Off] [Grain] [Glow] [Grid]

  Intensity
  [────●────] 50%

  ──────────────────

  Corner Radius
  [────●────] 16px

  Shadow
  [────●────] Medium
```

**Smart Behavior:**
- Default: Grain at 30% intensity (subtle texture)
- Show current effect in collapsed state
- All effects are optional enhancements

---

## Interaction Patterns

### Accordion Behavior

**Rule:** Opening a section auto-collapses the previously expanded section

**Exception:** User can pin a section to keep it open
- Shift+Click on section header to pin
- Pinned sections show pin icon
- Pinned sections don't auto-collapse

**Why this works:**
- Keeps sidebar focused on one task at a time
- Reduces cognitive load
- Advanced users can pin if they want multiple sections open

### Default Expansion Flow

**On page load (no screenshot):**
1. Screenshot section expanded (empty state: "Upload screenshot")
2. All other sections collapsed

**After screenshot upload:**
1. Screenshot auto-collapses
2. Background auto-expands (with gradient already applied)
3. User sees immediate result

**After background selected:**
1. Background auto-collapses
2. Look & Layout auto-expands
3. User customizes look

**After look selected:**
1. Look & Layout auto-collapses
2. Nothing auto-expands (user has working design)
3. User can manually explore Colors/Effects if desired

### Visual States

**Section Header States:**
```
Collapsed: ▶ Screenshot
Expanded:  ▼ Screenshot
Pinned:    📌 Screenshot
```

**Section Border/Divider:**
- Subtle border between sections
- Expanded section has slightly darker background
- Smooth expand/collapse animation (200ms ease-in-out)

**Empty State Guidance:**
- Large icons
- Clear call-to-action
- Secondary text explains file types/limits

**Success State:**
- Checkmark icon in collapsed header
- Subtle green accent (not overwhelming)
- "✓ Screenshot uploaded" in collapsed state

---

## Implementation Steps

### Phase 1: Foundation (Week 1)

**Goal:** Restructure sidebar without breaking existing functionality

#### Step 1.1: Create CollapsibleSection Component

**New file:** `/components/ui/collapsible-section.tsx`

```typescript
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  isPinned?: boolean;
  onPin?: () => void;
  statusText?: string; // e.g., "Using colors from screenshot"
  statusIcon?: "success" | "warning" | "none";
  children: React.ReactNode;
}

export function CollapsibleSection({ ... }: CollapsibleSectionProps) {
  // Renders:
  // - Header with title, status, expand/collapse icon, optional pin
  // - Animated content area (framer-motion or CSS transitions)
  // - Proper accessibility (aria-expanded, keyboard nav)
}
```

**Features:**
- Smooth expand/collapse animation
- Keyboard support (Enter/Space to toggle, Shift+Enter to pin)
- Aria labels for screen readers
- Optional status text/icon in collapsed state
- Click anywhere on header to toggle

#### Step 1.2: Create Sidebar State Management

**New file:** `/hooks/use-sidebar-state.ts`

```typescript
interface SidebarState {
  expandedSection: string | null; // "screenshot" | "logo" | "background" | etc.
  pinnedSections: Set<string>;
}

export function useSidebarState() {
  const [state, setState] = useAtom(sidebarStateAtom);

  const expandSection = (sectionId: string, autoCollapse = true) => {
    // If autoCollapse, collapse previously expanded (unless pinned)
    // Update expandedSection
  };

  const togglePin = (sectionId: string) => {
    // Add/remove from pinnedSections
  };

  // Smart auto-expansion logic based on upload state
  const handleScreenshotUploaded = () => {
    expandSection("background", true);
  };

  return { expandSection, togglePin, ... };
}
```

**State stored in Jotai atom:**
- Persists across component re-renders
- Can be reset on export/clear
- Remembers user preferences (pinned sections) for session

#### Step 1.3: Migrate Assets Tab Content

**Update:** `/components/layout-config.tsx`

**Current structure:**
```tsx
<Tabs defaultValue="design">
  <TabsList>
    <TabsTrigger value="design">Design</TabsTrigger>
    <TabsTrigger value="assets">Assets</TabsTrigger>
  </TabsList>
  <TabsContent value="design">...</TabsContent>
  <TabsContent value="assets">...</TabsContent>
</Tabs>
```

**New structure:**
```tsx
<div className="flex flex-col">
  <CollapsibleSection
    title="Screenshot"
    isExpanded={expandedSection === "screenshot"}
    onToggle={() => expandSection("screenshot")}
    statusText={screenshotAsset ? `Zoom: ${zoom}%` : undefined}
    statusIcon={screenshotAsset ? "success" : "none"}
  >
    <ScreenshotControls />
  </CollapsibleSection>

  <CollapsibleSection
    title="Logo"
    isExpanded={expandedSection === "logo"}
    onToggle={() => expandSection("logo")}
    statusText={logoAsset ? "Uploaded" : "Optional"}
  >
    <LogoControls />
  </CollapsibleSection>

  <CollapsibleSection
    title="Background"
    isExpanded={expandedSection === "background"}
    onToggle={() => expandSection("background")}
    statusText={getBackgroundStatus(config)}
  >
    <BackgroundControls />
  </CollapsibleSection>

  {/* ... more sections */}
</div>
```

**Extract existing code into section components:**
- `<ScreenshotControls />` - Screenshot upload + zoom slider
- `<LogoControls />` - Logo upload/remove
- `<BackgroundControls />` - Gradient/Image/AI picker
- `<LookControls />` - Look selector + text editor
- `<ColorControls />` - Color pickers
- `<EffectsControls />` - Pattern overlays, shadows

#### Step 1.4: Test Migration

**Verify:**
- All existing functionality works
- No visual regressions
- Collapsing/expanding is smooth
- State persists correctly

---

### Phase 2: Smart Defaults (Week 2)

**Goal:** Implement auto-expansion logic and strong defaults

#### Step 2.1: Auto-Expansion on Upload

**Update:** `/hooks/use-playground-controller.ts`

In `handleFileProcess` function, after screenshot upload:
```typescript
const handleFileProcess = async (file: File, assetType: AssetType) => {
  // ... existing upload logic ...

  if (assetType === "screenshot") {
    // Trigger auto-expansion
    sidebarState.expandSection("background");
  } else if (assetType === "logo") {
    sidebarState.expandSection("look");
  }
};
```

#### Step 2.2: Auto-Apply Best Gradient

**Update:** `/hooks/use-color-analysis.ts`

After color analysis completes:
```typescript
useEffect(() => {
  if (colorPalette && !config.background) {
    // Auto-select best gradient from screenshot
    const generatedGradients = generateGradientOptions(colorPalette);
    const bestGradient = generatedGradients[0]; // First is "best"

    setConfig({
      ...config,
      customGradient: bestGradient,
      background: { type: "gradient", value: "custom" }
    });
  }
}, [colorPalette]);
```

**Why this works:**
- User uploads screenshot → gradient automatically applied
- No "blank white background" state
- User sees immediate results

#### Step 2.3: Progressive Disclosure - "More Options"

**Update:** `/components/gradient-picker.tsx`

Add collapsible "More options" toggle:
```tsx
<div className="flex flex-col gap-3">
  {/* Default: Show 4 screenshot-generated gradients */}
  <GradientSwatches gradients={generatedGradients.slice(0, 4)} />

  {showMoreOptions ? (
    <>
      <Label>Presets</Label>
      <GradientSwatches gradients={presetGradients} />

      <Label>Custom</Label>
      <CustomGradientEditor />
    </>
  ) : (
    <Button variant="ghost" onClick={() => setShowMoreOptions(true)}>
      ▶ More options
    </Button>
  )}
</div>
```

**Why this works:**
- 4 gradients is enough for most users
- Advanced users can expand
- Reduces initial cognitive load

#### Step 2.4: Empty State Guidance

**Create:** `/components/ui/empty-state.tsx`

```tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ ... }: EmptyStateProps) {
  // Renders centered empty state with large icon, title, description
  // Optional primary/secondary actions
}
```

**Use in sections:**
```tsx
<CollapsibleSection title="Screenshot" ...>
  {!screenshotAsset ? (
    <EmptyState
      icon={<UploadCloud size={48} />}
      title="Upload screenshot"
      description="PNG, JPG, SVG up to 10MB"
      action={{
        label: "Choose file",
        onClick: handleUpload
      }}
    />
  ) : (
    <ScreenshotPreview asset={screenshotAsset} />
  )}
</CollapsibleSection>
```

---

### Phase 3: Background Type Refactor (Week 3)

**Goal:** Add AI background type alongside Gradient/Image

#### Step 3.1: Extend Background Type System

**Update:** `/domain/layout/types.ts`

```typescript
export type BackgroundType = "gradient" | "solid" | "image" | "ai-generated";

export interface BackgroundConfig {
  type: BackgroundType;
  value: string; // asset ID for image, gradient ID, or AI generation ID
}

// New type for AI-generated backgrounds
export interface AIBackgroundConfig {
  id: string; // unique ID for this generation
  prompt: string; // constructed prompt (internal)
  style: "abstract-shapes" | "geometric" | "flowing" | "particles";
  complexity: number; // 1-10
  colorSource: "screenshot" | "custom";
  imageUrl: string; // generated image URL
  createdAt: number; // timestamp
}
```

**Add to LayoutConfig:**
```typescript
export interface LayoutConfig {
  // ... existing fields ...
  aiBackgrounds?: AIBackgroundConfig[]; // Store generated backgrounds
}
```

#### Step 3.2: Create AI Background Generation Endpoint

**New file:** `/app/api/generate-background/route.ts`

```typescript
import { Replicate } from "replicate";

export async function POST(request: Request) {
  const { colors, style, complexity } = await request.json();

  // Construct prompt from parameters
  const prompt = buildBackgroundPrompt(colors, style, complexity);

  // Call SDXL Turbo or Flux Schnell
  const replicate = new Replicate();
  const output = await replicate.run(
    "stability-ai/sdxl-turbo:...",
    {
      input: {
        prompt,
        width: 1920,
        height: 1080,
        num_inference_steps: 4, // Turbo mode
      }
    }
  );

  return Response.json({
    imageUrl: output[0],
    prompt, // Return for debugging
  });
}
```

**Helper function:**
```typescript
function buildBackgroundPrompt(
  colors: ColorPalette,
  style: string,
  complexity: number
): string {
  const styleDescriptions = {
    "abstract-shapes": "soft flowing organic shapes",
    "geometric": "bold geometric patterns and angular shapes",
    "flowing": "smooth gradients and flowing forms",
    "particles": "scattered particles and dots"
  };

  const complexityDesc = complexity < 4 ? "minimal" : complexity < 7 ? "moderate" : "complex";

  return `Abstract ${styleDescriptions[style]}, ${complexityDesc} composition,
          using colors ${colors.dominant}, ${colors.accent}, ${colors.vibrant},
          high quality, modern, clean, suitable as background,
          no text, no objects, abstract art, 8k`;
}
```

#### Step 3.3: Create AI Background UI

**New file:** `/components/ai-background-generator.tsx`

```tsx
export function AIBackgroundGenerator() {
  const [config, setConfig] = useAtom(configAtom);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const colors = useAtomValue(screenshotColorsAtom);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-background", {
        method: "POST",
        body: JSON.stringify({
          colors,
          style: "abstract-shapes", // Default
          complexity: 5 // Default
        })
      });

      const { imageUrl, prompt } = await response.json();

      // Save to config
      const aiBackground: AIBackgroundConfig = {
        id: nanoid(),
        prompt,
        style: "abstract-shapes",
        complexity: 5,
        colorSource: "screenshot",
        imageUrl,
        createdAt: Date.now()
      };

      setConfig({
        ...config,
        aiBackgrounds: [...(config.aiBackgrounds || []), aiBackground],
        background: { type: "ai-generated", value: aiBackground.id }
      });

      setGenerationCount(prev => prev + 1);
    } finally {
      setIsGenerating(false);
    }
  };

  const remainingGenerations = 5 - generationCount;
  const currentAIBg = config.aiBackgrounds?.find(
    bg => bg.id === config.background?.value
  );

  return (
    <div className="flex flex-col gap-4">
      {!currentAIBg ? (
        <>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || remainingGenerations <= 0}
          >
            {isGenerating ? "Generating..." : "Generate Background"}
          </Button>

          <p className="text-sm text-muted-foreground">
            Styled automatically from your screenshot colors
          </p>

          <Separator />

          <Button variant="ghost" onClick={() => setShowRefine(true)}>
            ▶ Customize style
          </Button>
        </>
      ) : (
        <>
          <div className="aspect-video rounded-lg overflow-hidden">
            <img src={currentAIBg.imageUrl} alt="Generated background" />
          </div>

          <p className="text-sm text-muted-foreground">
            {getStyleDescription(currentAIBg.style)}
          </p>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} variant="outline">
              ↻ Regenerate
            </Button>
            <Button onClick={() => setShowRefine(true)} variant="outline">
              ⚙ Refine Style
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {remainingGenerations}/5 generations remaining
          </p>
        </>
      )}
    </div>
  );
}
```

#### Step 3.4: Integrate into BackgroundControls

**Update:** `/components/background-controls.tsx` (new extracted component)

```tsx
export function BackgroundControls() {
  const [bgType, setBgType] = useState<"gradient" | "image" | "ai">("gradient");

  return (
    <div className="flex flex-col gap-4">
      {/* Large preview */}
      <BackgroundPreview />

      {/* Type selector */}
      <SegmentedControl
        value={bgType}
        onChange={setBgType}
        options={[
          { id: "gradient", label: "Gradient" },
          { id: "image", label: "Image" },
          { id: "ai", label: "AI ✨" }
        ]}
      />

      {/* Type-specific controls */}
      {bgType === "gradient" && <GradientPicker />}
      {bgType === "image" && <ImageUpload />}
      {bgType === "ai" && <AIBackgroundGenerator />}
    </div>
  );
}
```

---

### Phase 4: Polish & Performance (Week 4)

**Goal:** Smooth animations, localStorage persistence, performance optimization

#### Step 4.1: localStorage Persistence

**Update:** `/hooks/use-playground-controller.ts`

```typescript
// Save to localStorage on config change
useEffect(() => {
  if (config && assets.length > 0) {
    const serialized = {
      config,
      assets,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem("dope-shot-session", JSON.stringify(serialized));
    } catch (e) {
      // Handle quota exceeded (large images)
      console.warn("localStorage full, skipping save");
    }
  }
}, [config, assets]);

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem("dope-shot-session");
  if (saved) {
    try {
      const { config, assets, timestamp } = JSON.parse(saved);

      // Only restore if less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        setConfig(config);
        setAssets(assets);
      }
    } catch (e) {
      console.warn("Failed to restore session");
    }
  }
}, []);
```

**Handle large data URLs:**
- Compress images before storing
- Use IndexedDB for images >1MB
- Show "Session restored" toast on page load

#### Step 4.2: Generation Limits & Messaging

**Create:** `/components/ui/generation-banner.tsx`

```tsx
export function GenerationBanner() {
  const [isDismissed, setIsDismissed] = useLocalStorage("generation-banner-dismissed", false);

  if (isDismissed) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">Your design is saved in this browser session</p>
          <p className="text-sm text-muted-foreground mt-1">
            Export your image to keep it permanently, or refresh to start over.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsDismissed(true)}>
          ✕
        </Button>
      </div>
    </div>
  );
}
```

**Show after first AI generation:**
- Persistent banner at top of sidebar
- Dismissible (stores in localStorage)
- Links to export button

#### Step 4.3: Smooth Animations

**Update:** `/components/ui/collapsible-section.tsx`

Use `framer-motion` for smooth expand/collapse:
```tsx
import { motion, AnimatePresence } from "framer-motion";

export function CollapsibleSection({ isExpanded, children, ... }) {
  return (
    <div className="border-b">
      <button onClick={onToggle} className="w-full p-4 flex justify-between">
        <span>{title}</span>
        <motion.span
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▶
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="p-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Performance:**
- Use `layoutId` for shared element transitions
- Lazy load AI generation components
- Debounce slider changes
- Throttle preview updates

#### Step 4.4: Accessibility

**Keyboard Navigation:**
- Tab through section headers
- Enter/Space to expand/collapse
- Shift+Enter to pin section
- Arrow keys to navigate between sections

**Screen Readers:**
- Proper aria-expanded attributes
- Announce state changes
- Label all interactive elements
- Provide context for empty states

**Focus Management:**
- Focus on section content when expanded
- Restore focus to header when collapsed
- Skip navigation links

---

## Testing Checklist

### Functional Testing

- [ ] Screenshot upload works
- [ ] Zoom slider updates preview in real-time
- [ ] Logo upload/remove works (when look supports it)
- [ ] Gradient auto-applies on screenshot upload
- [ ] All 3 gradient sources work (screenshot, preset, custom)
- [ ] Image background upload works
- [ ] AI background generation works
- [ ] AI refinement modal works
- [ ] Generation limits enforce (5/session)
- [ ] Look selector updates preview
- [ ] Text editor saves changes
- [ ] Color pickers update design
- [ ] Effects apply correctly

### UX Testing

- [ ] Sections expand/collapse smoothly
- [ ] Auto-expansion feels natural
- [ ] Pinning sections works
- [ ] Empty states are clear
- [ ] Success states are visible
- [ ] No overwhelming feeling (only 1-2 sections open)
- [ ] Default flow feels guided
- [ ] Advanced options are discoverable but hidden

### Performance Testing

- [ ] No lag when expanding/collapsing
- [ ] Image previews load quickly
- [ ] AI generation shows loading state
- [ ] localStorage saves/restores correctly
- [ ] No memory leaks on repeated uploads
- [ ] Large files don't crash browser

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces states
- [ ] Focus management is correct
- [ ] Color contrast meets WCAG AA
- [ ] All interactions have keyboard alternatives

---

## Success Metrics

**Adoption:**
- % of users who expand Background section
- % of users who try AI generation
- Avg. sections expanded per session

**Usability:**
- Time to first export (should decrease)
- Completion rate (users who upload → export)
- Section collapse rate (if users manually collapse auto-expanded sections, flow might be wrong)

**Performance:**
- Sidebar render time (<100ms)
- Expand/collapse animation smoothness (60fps)
- localStorage save time (<50ms)

**Target benchmarks:**
- 80%+ users expand Background section
- 30%+ users try AI generation (if they see it)
- <5 seconds from screenshot upload to first export
- 90%+ completion rate (upload → export)

---

## Rollout Plan

### Week 1: Foundation
- Build CollapsibleSection component
- Create sidebar state management
- Migrate existing code to new structure
- Test that nothing breaks

### Week 2: Smart Defaults
- Implement auto-expansion logic
- Add auto-gradient application
- Create progressive disclosure ("More options")
- Add empty state guidance

### Week 3: AI Backgrounds
- Build generation endpoint
- Create AI background UI
- Integrate into Background section
- Add generation limits

### Week 4: Polish
- Add localStorage persistence
- Implement smooth animations
- Add generation banner
- Fix accessibility issues
- Performance optimization

### Week 5: Launch
- Internal testing
- Gather feedback
- Fix critical bugs
- Ship to production

---

## Future Enhancements

### Phase 5+ Ideas

1. **Smart Suggestions**
   - "Your background and screenshot colors clash" warning
   - "Try a different look for this content" suggestion
   - "Add text to make this more engaging" prompt

2. **Preset Templates**
   - "Social Media Post" preset (auto-selects look, colors, effects)
   - "GitHub README" preset
   - "Product Hunt Launch" preset
   - One-click apply, then customize

3. **History & Favorites**
   - "Recently Used" section showing last 5 designs
   - "Save as Favorite" to bookmark configurations
   - Quick load from favorites

4. **Collaborative Features** (requires backend)
   - Share design link
   - Team templates
   - Brand kits (saved colors, logos, styles)

5. **Advanced AI**
   - "Make it more professional" prompt
   - Content-aware generation (detects code → tech style)
   - Style transfer from inspiration images

---

## Questions & Decisions

### Open Questions

1. **Should pinning be visible to all users or hidden (Shift+Click)?**
   - Recommendation: Hidden initially, show tooltip on hover
   - Keeps UI clean for majority of users

2. **How long should localStorage persist?**
   - Recommendation: 24 hours
   - Balances "don't lose my work" with "fresh start"

3. **Should we show a welcome tour?**
   - Recommendation: Optional, dismissible
   - Only for first-time users
   - Highlights: Upload → Background → Export flow

4. **What happens when user refreshes during AI generation?**
   - Recommendation: Show "Restoring session..." then mark as failed
   - Don't retry automatically (costs money)
   - User can regenerate manually

5. **Should sections remember their expanded state across sessions?**
   - Recommendation: No, reset on page load
   - Consistent experience for all users
   - Pinned sections are session-only

### Key Decisions Made

✅ **Single sidebar over two tabs** - Better workflow, less cognitive load
✅ **Collapsible sections** - Keeps UI clean, focuses attention
✅ **Accordion behavior by default** - Only 1-2 sections open at a time
✅ **Auto-expansion after upload** - Guides user through workflow
✅ **Strong defaults** - Auto-apply best gradient, pre-select popular look
✅ **Progressive disclosure** - Hide advanced options behind "More options"
✅ **localStorage persistence** - Handle refreshes without backend
✅ **5 generation limit** - Control costs, create upgrade opportunity

---

## Conclusion

This single sidebar approach maintains simplicity while adding powerful AI features. Key principles:

1. **Not overwhelming** - Collapsible sections, accordion behavior, progressive disclosure
2. **Strong defaults** - Auto-gradient, pre-selected looks, zero-config success
3. **Natural workflow** - Top-to-bottom mirrors design process
4. **Progressive disclosure** - Advanced features hidden but discoverable

The implementation is phased to minimize risk and validate assumptions early. After 4 weeks, we'll have a polished, AI-enhanced sidebar that feels simple despite being powerful.
