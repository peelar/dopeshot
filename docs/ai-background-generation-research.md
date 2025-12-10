# AI Background Generation - Product Research

## Executive Summary

This document explores adding AI-generated abstract backgrounds to Dope Shot, addressing key product questions around timing (pre-persistence), UI surfacing, and feature design.

**Key Recommendations:**
1. **Add AI backgrounds now** - Use session persistence and set clear expectations
2. **Elevate backgrounds to first-class assets** - Move to Assets tab alongside screenshot/logo
3. **Keep prompt UI minimal** - Auto-generate from screenshot colors with optional refinement
4. **Phase the rollout** - Start with abstract shapes, expand to style-specific generations

---

## Current State Analysis

### Background Feature Today

**Three background types:**
- **Gradient** - Multi-stop gradients (preset, custom, or screenshot-derived)
- **Image** - Static uploaded images
- **Solid** - Solid color backgrounds

**Current UI location:**
- Lives in **Design tab** of right sidebar
- Gradient/Image toggle with conditional controls
- GradientPicker has 3 sub-tabs: "From Screenshot", "Custom", "Presets"

**Key issue:** Backgrounds feel like an afterthought rather than a first-class feature. The gradient system is sophisticated (auto-generated from screenshots, 8 presets, custom 3-stop editor) but image backgrounds are just a simple upload dropzone.

### Asset Management Today

**Assets tab contains:**
- Screenshot dropzone
- Logo dropzone (if look supports it)

**Missing:** Background images don't appear here, even though they're stored in the same `Asset[]` array and referenced the same way (`config.assets.background`).

---

## Question 1: Should we add AI features before persistence?

### TL;DR: Yes, with caveats

### Arguments FOR adding now:

**1. Validates the feature concept**
- Test if users want AI backgrounds before investing in persistence infrastructure
- Gather feedback on prompt quality, generation speed, style preferences
- Fail fast if adoption is low

**2. Session persistence is "good enough" for exploration**
- Users can still experiment and export during a single session
- Most users likely complete their work in one sitting
- localStorage can save work-in-progress (reloads preserved, just not cross-device)

**3. AI features drive product differentiation**
- Competitors (Canva, Figma, Bannerbear) are all racing to add AI
- Being early positions Dope Shot as innovative
- AI features can be the hook that makes users want persistence

**4. Cost control is manageable**
- Rate limiting per session (e.g., 5 generations/session)
- Cheap model for abstract backgrounds (SDXL Turbo, Flux Schnell)
- Caching common patterns (same color palette = reuse generation)

### Arguments AGAINST:

**1. Wasted compute if users refresh**
- User generates background → refreshes → loses it → generates again
- Multiplies your costs without adding value

**2. Poor user experience**
- Frustration from losing AI-generated work
- May create negative association with the AI feature

**3. Competitive disadvantage**
- "This tool loses my work" is a dealbreaker for many users
- Users may leave to competitors with persistence

### Recommendation: Add with guardrails

**Implement session persistence + expectation setting:**

1. **localStorage fallback** - Serialize config + assets on change, restore on page load
   - Handles accidental refreshes
   - Prevents most common data loss scenarios
   - Zero backend cost

2. **Clear messaging** - Show persistent banner on first AI generation:
   > "Your design is saved in this browser session. Export your image to keep it permanently, or refresh to start over."

3. **Generation limits** - 5 free AI backgrounds per session
   - Reduces abuse
   - Creates urgency to export before refreshing
   - Future: "Sign up to unlock unlimited AI backgrounds"

4. **Export prompts** - After AI generation, show export button prominently
   - "Love this background? Export now to save it"
   - Reduces perceived loss from refresh

5. **Tracking** - Log generation usage vs. export rate
   - If users generate backgrounds but don't export, feature may not be valuable
   - If users export frequently, validates persistence need

**Cost calculation example:**
- SDXL Turbo on Replicate: ~$0.002 per generation (512x512)
- 1000 generations/day = $2/day = $60/month
- With caching + rate limiting, likely much lower

---

## Question 2: How to surface background feature?

### Current Problem

**Background feels buried:**
- Small section in Design tab with simple gradient/image toggle
- Doesn't feel like a primary design decision
- Adding "AI Generated" as third option will make it more cramped
- No visual prominence despite being a major visual element

**Mental model issue:**
- Assets tab = file uploads (screenshot, logo) - technical
- Design tab = creative decisions (colors, text, layout) - design
- Background is a creative/design decision, not just file management
- AI prompting is definitely a design activity, not asset management

### Recommendation: Elevate backgrounds within Design tab

**Keep backgrounds in Design, but make them a primary section:**

**Option A: Move Background to top**

```
Design Tab
├── Background [PROMINENT - shown first]
│   ├── Large preview thumbnail of current background
│   ├── Type: [Gradient] [Image] [AI ✨]
│   └── Type-specific controls (expanded below)
├── Look [selector]
├── Text [editor]
├── Colors
└── Effects (grain, glow, grid)
```

**Why this works:**
- Background is first thing you see (visual hierarchy)
- Large preview shows it's important
- Type switcher feels like equal options, not "gradient with image afterthought"
- AI generation gets same prominence as gradients

**Option B: Collapsible sections with visual previews**

```
Design Tab

┌─ Background ────────────────────────┐
│ ┌──────────────────────────────┐   │ ← Large preview
│ │     [Current background]     │   │
│ │         preview here         │   │
│ └──────────────────────────────┘   │
│                                     │
│ [Gradient] [Image] [AI ✨]          │
│ [Expanded controls for selected]    │
└─────────────────────────────────────┘

▼ Look & Layout
  [Look selector, text, etc.]

▼ Colors
  [Color pickers]

▼ Effects
  [Grain, glow, grid]
```

**Why this works:**
- Collapsible sections let background take full width when expanded
- Preview thumbnail gives immediate feedback
- Other sections collapse to give background room to breathe
- User can focus on one aspect at a time

**Option C: Side-by-side type selector**

```
Design Tab
├── Look [selector]
├── Text [editor]
├── Background
│   ┌──────────────────────────────────┐
│   │  [Gradient] [Image] [AI ✨]      │
│   │                                  │
│   │  ┌────┐ ┌────┐ ┌────┐           │
│   │  │ G  │ │ I  │ │ AI │  ← Cards  │
│   │  └────┘ └────┘ └────┘           │
│   │  Each shows preview of result    │
│   │                                  │
│   │  [Expanded controls below]       │
│   └──────────────────────────────────┘
├── Colors
└── Effects
```

**Why this works:**
- Three equal cards make each option feel first-class
- Visual previews help users understand what each does
- More space for controls
- Modern card-based UI pattern

### Recommendation: Option B (Collapsible)

This gives background the prominence it deserves while keeping Design tab clean. Key changes:

1. **Large preview** - Shows background is important
2. **Three equal options** - Gradient, Image, AI all feel first-class
3. **Collapsible sections** - Other design controls don't compete for attention
4. **More control space** - AI prompting gets room for refinement options

The mental model stays correct: **Design tab = creative decisions** (including AI prompting), **Assets tab = file uploads** (screenshot, logo).

---

## Question 3: Minimal UI for AI prompting

### Design Principles

1. **Zero-input by default** - Generate smart backgrounds without user prompt
2. **Optional refinement** - Advanced users can tweak if needed
3. **Fast feedback** - Show preview in <3 seconds
4. **One-click regenerate** - Easy to try different variations

### Recommended UI Flow

**Step 1: Initial state (no AI background)**

```
┌─ Background ────────────────────────┐
│ Type: [Gradient] [Image] [AI ✨]    │
│                                      │
│ [Generate AI Background]             │
│ Automatically styled from your       │
│ screenshot colors                    │
└──────────────────────────────────────┘
```

**Step 2: After clicking "Generate"**

```
┌─ Background ────────────────────────┐
│ Type: [Gradient] [Image] [AI ✨]    │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ [Preview thumbnail]            │  │
│ │ Abstract shapes in blues       │  │
│ └────────────────────────────────┘  │
│                                      │
│ Style: Flowing shapes               │
│                                      │
│ [↻ Regenerate] [⚙️ Refine]           │
└──────────────────────────────────────┘
```

**Step 3: Optional refinement modal**

```
┌─ Refine AI Background ──────────────┐
│                                      │
│ Style:                               │
│ ( ) Abstract shapes                  │
│ (•) Geometric patterns               │
│ ( ) Flowing gradients                │
│ ( ) Particle system                  │
│                                      │
│ Complexity:                          │
│ [──────●─────] (5/10)               │
│                                      │
│ Color source:                        │
│ (•) From screenshot                  │
│ ( ) Custom palette                   │
│                                      │
│        [Cancel] [Generate]           │
└──────────────────────────────────────┘
```

### Under the Hood: Smart Prompts

**User never writes prompts.** Instead, we construct them from:

1. **Screenshot color palette** (already extracted via node-vibrant)
   - `colors.dominant`, `colors.accent`, `colors.vibrant`, `colors.muted`

2. **Selected look style** (config.lookId)
   - PopupGradient → soft, flowing shapes
   - HeroCenter → bold, geometric patterns
   - AdaptiveScreenshot → subtle, minimal backgrounds

3. **Content analysis** (optional, phase 2)
   - Detect if screenshot has code → tech-style patterns
   - Detect if screenshot has UI → clean, modern shapes
   - Detect if screenshot has product → e-commerce style

**Example prompt construction:**

```typescript
function buildBackgroundPrompt(config: LayoutConfig, colors: ColorPalette): string {
  const styleMap = {
    "popup-gradient": "soft flowing organic shapes",
    "hero-center": "bold geometric patterns",
    "adaptive-screenshot": "minimal subtle background elements"
  };

  const style = styleMap[config.lookId] || "abstract shapes";
  const colorDescription = `using colors ${colors.dominant}, ${colors.accent}, and ${colors.vibrant}`;

  return `Abstract ${style} ${colorDescription},
          high quality, minimalist, modern, clean composition,
          suitable as website hero background, 8k`;
}
```

**Why this works:**
- No prompt writing barrier for users
- Consistent quality (we control the prompts)
- Fast generation (optimized prompts = better model performance)
- Coherent with screenshot (colors match automatically)

---

## Other AI Image Features to Consider

### 1. Smart Background Removal (High Priority)

**What:** Remove background from screenshot, place on custom background

**Why:**
- Massive use case: product shots, app mockups, profile pictures
- Complements AI background generation
- Competing tools charge per removal (revenue opportunity)

**Implementation:**
- Use RMBG-1.4 or BiRefNet (free, fast)
- Add "Remove Background" button on screenshot asset
- Store as transparent PNG in assets
- Show checkered background in preview

**UI addition to Assets tab:**
```
Screenshot
[Preview thumbnail]
[Replace] [Remove Background]
```

### 2. Smart Object Placement (Medium Priority)

**What:** AI suggests where to place logo, text, CTA based on screenshot content

**Why:**
- Users struggle with composition
- Saves time experimenting with layouts
- Increases perceived "smartness" of tool

**Implementation:**
- Analyze screenshot for regions of interest (faces, products, text)
- Use saliency detection to find focus areas
- Suggest logo/text positions that don't occlude important content
- Show "Auto-position" button with preview

**Example:**
```
Logo Position
[Top-left ▼]
✨ Auto-position (recommended: top-right)
```

### 3. Style Transfer Backgrounds (Medium Priority)

**What:** Apply artistic styles (watercolor, geometric, neon) to uploaded screenshots or generated backgrounds

**Why:**
- More creative control than just gradients
- Differentiates from competitors
- Can charge premium for "Pro Styles"

**Implementation:**
- Use ControlNet or style transfer models
- Preset styles: "Watercolor", "Low Poly", "Neon Glow", "Paper Cutout"
- Apply to either screenshot or background layer
- Fast models (<2s generation)

**UI in Background section:**
```
AI Generated
Style: [Abstract Shapes ▼]
• Abstract Shapes
• Geometric Patterns
• Watercolor Texture
• Neon Glow
• Low Poly
• Paper Cutout
```

### 4. Color Palette Suggestions (Low Priority, High Value)

**What:** AI suggests brand color schemes based on screenshot

**Why:**
- Users often don't have brand guidelines
- Removes color selection paralysis
- Already have color extraction infrastructure

**Implementation:**
- Extend current color analysis
- Use color theory rules (complementary, triadic, analogous)
- Generate 3-5 palette options
- One-click apply to all color tokens

**UI in Design tab:**
```
Colors
Current: [Blue] [Orange] [White]

✨ Suggested palettes from screenshot:
[Palette 1: ■ ■ ■] [Palette 2: ■ ■ ■] [Palette 3: ■ ■ ■]
Click to apply
```

### 5. Animated Backgrounds (Low Priority)

**What:** Subtle motion backgrounds (floating particles, gradient shifts, parallax)

**Why:**
- High perceived value ("wow factor")
- Great for social media content
- Export as video instead of static image

**Implementation:**
- Use lottie animations or CSS animations
- 5-10 preset animations
- Record to video using canvas.captureStream()
- Export as MP4 or WebM

**Challenges:**
- Video export is complex (needs ffmpeg.wasm or server-side)
- File sizes larger
- Preview performance needs optimization

**UI addition:**
```
Background
Type: [Gradient] [Image] [AI ✨] [Animated 🎬]

Animation: [Floating Particles ▼]
Speed: [────●───] (5/10)
```

### 6. Text-to-Image for Content (Low Priority)

**What:** Generate product images, icons, illustrations from text

**Why:**
- Users may not have screenshots ready
- Enables fully AI-generated content
- Large market (stock photo replacement)

**Implementation:**
- Use SDXL or Flux
- Focus on specific use cases: icons, product mockups, abstract illustrations
- Template-based prompts (like background generation)

**Challenges:**
- Generation quality highly variable
- Users expect high quality (harder than backgrounds)
- Longer generation times (5-10s)

**UI:**
```
Screenshot
[Upload Screenshot]
or
[Generate with AI ✨]

What should we generate?
• App Icon
• Product Mockup
• Abstract Illustration
• Logo Design
```

---

## Feature Priority Matrix

| Feature | User Value | Eng. Effort | Cost/Gen | Priority |
|---------|-----------|-------------|----------|----------|
| AI Background Generation | High | Medium | $0.002 | **P0** (this doc) |
| Background Removal | Very High | Low | Free | **P0** |
| Color Palette Suggestions | Medium | Low | Free | **P1** |
| Smart Object Placement | Medium | Medium | Free | **P2** |
| Style Transfer | High | Medium | $0.005 | **P2** |
| Animated Backgrounds | High | High | N/A | **P3** |
| Text-to-Image Content | Very High | High | $0.02 | **P3** |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

1. **Add localStorage persistence**
   - Serialize configAtom + assetsAtom on change
   - Restore on page load
   - Handle large data URLs (compress or use IndexedDB)

2. **Reorganize Assets tab**
   - Add Background section to Assets tab
   - Move background controls from Design tab
   - Update mental model: Assets = materials, Design = styling

3. **Add background removal**
   - Integrate RMBG-1.4 API
   - Add "Remove Background" button on screenshot
   - Handle transparent PNGs in rendering

### Phase 2: AI Backgrounds (Week 3-4)

1. **Build prompt generation system**
   - Color palette → color description
   - Look style → shape/pattern style
   - Construct optimized prompts

2. **Integrate image generation API**
   - Start with Replicate SDXL Turbo
   - Add server-side endpoint `/api/generate-background`
   - Implement caching (LRU cache like gradient API)

3. **Build minimal UI**
   - "Generate AI Background" button
   - Preview thumbnail
   - Regenerate + optional refine
   - Generation limits (5/session)

4. **Add expectation setting**
   - Banner on first generation about persistence
   - Export prompts after generation
   - Usage tracking (generations vs. exports)

### Phase 3: Refinement (Week 5-6)

1. **Add style presets**
   - Abstract Shapes (default)
   - Geometric Patterns
   - Flowing Gradients
   - Particle Systems

2. **Build refinement modal**
   - Style selector
   - Complexity slider
   - Color source toggle

3. **Optimize performance**
   - Lazy load AI components
   - Prefetch common patterns
   - Progressive image loading

### Phase 4: Expansion (Week 7+)

1. **Color palette suggestions**
2. **Smart object placement**
3. **Style transfer**
4. **Animated backgrounds**

---

## Success Metrics

**Adoption:**
- % of sessions that use AI background generation
- Avg. generations per session
- % of generated backgrounds that get exported

**Quality:**
- % of users who regenerate (1 = bad, 2-3 = good, 5+ = poor prompts)
- User feedback (thumbs up/down on generated backgrounds)

**Business:**
- Generation cost per month
- Export rate increase (AI backgrounds → more exports)
- Conversion rate to paid plans (when persistence is gated)

**Target benchmarks:**
- 30%+ of sessions try AI backgrounds
- 2.5 avg. generations/session
- 60%+ export after generating
- <$100/month generation costs

---

## Open Questions

1. **Should we allow custom prompts?**
   - Pro: Power users want control
   - Con: Poor prompts = poor results = bad perception
   - Recommendation: Phase 2, behind "Advanced" toggle

2. **What image dimensions?**
   - Option A: Match canvas dimensions (dynamic)
   - Option B: Fixed 1920x1080 (crop to fit)
   - Recommendation: Start with fixed, optimize later

3. **How many style presets?**
   - Too few = limited creativity
   - Too many = decision paralysis
   - Recommendation: 4-6 presets, expand based on usage

4. **Should we cache generations across users?**
   - If two users have same colors + style, reuse generation
   - Pro: Massive cost savings
   - Con: Less "unique" feel
   - Recommendation: Yes, but add subtle variations (noise seed)

5. **When to gate behind auth?**
   - Option A: Free AI backgrounds forever (acquisition focus)
   - Option B: 5 free, then require signup (freemium)
   - Option C: AI backgrounds only for paid users (premium feature)
   - Recommendation: Start with B (5 free), adjust based on adoption

---

## Conclusion

**Add AI background generation now**, before full persistence:
- Use localStorage for session persistence
- Set clear expectations about refresh behavior
- Limit to 5 generations/session
- Track adoption before investing in backend

**Elevate backgrounds to Assets tab**:
- Move from Design tab to Assets tab alongside screenshot/logo
- Makes backgrounds first-class citizens
- Better discoverability and mental model

**Keep prompt UI minimal**:
- Zero-input default (auto-generate from screenshot colors)
- Optional refinement for advanced users
- Smart prompt construction under the hood

**Phase the rollout**:
1. Foundation: localStorage + Assets tab reorganization
2. AI Backgrounds: Minimal prompt-free generation
3. Refinement: Style presets + advanced options
4. Expansion: Background removal, color suggestions, more AI features

This approach validates the feature quickly, controls costs, and sets up for future expansion into more sophisticated AI features.
