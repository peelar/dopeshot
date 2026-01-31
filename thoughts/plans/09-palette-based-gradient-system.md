# Palette-Based Gradient System

## Problem Statement

The current gradient generation pipeline is fully dynamic: extract colors → normalize in OKLCH → apply color theory → hope it looks good. This approach has fundamental issues:

1. **Unpredictable output** - Color theory at runtime produces inconsistent results
2. **Hard to debug** - When a gradient looks muddy, it's unclear which step failed
3. **Magic numbers everywhere** - `brighten: 0.2`, `desaturate: 0.15` etc. with no validation
4. **Constant fixes** - We keep adjusting thresholds and parameters reactively
5. **Test fragility** - Tests use relaxed thresholds (LAB distance < 40-45) because normalization shifts colors unpredictably

## Proposed Solution

Replace fully generative gradients with **curated palette matching**:

1. Pre-define validated gradient palettes that are known to look good
2. Extract a simplified "color signature" from screenshots
3. Match screenshots to the closest validated palette
4. Apply the palette to various gradient layouts (linear, mesh, radial, etc.)

This trades runtime flexibility for **guaranteed quality**.

## Architecture Overview

```
Screenshot Input
      ↓
Extract Color Signature (simplified)
  - dominant hue bucket (red/orange/yellow/green/teal/blue/purple/pink/neutral)
  - brightness class (dark/medium/light)
  - accent strength (vibrant/muted/grayscale)
      ↓
Match to Palette Cluster
  e.g., "dark-orange-vibrant" → palette_id: "sunset-dark-001"
      ↓
Load Palette → Apply to Layout
      ↓
Render Gradient
```

## Data Structures

### Color Signature (extracted from screenshot)

```ts
type ColorSignature = {
  // Bucketed hue (simplified from continuous 0-360)
  dominantHue: HueBucket;

  // The actual extracted dominant color (for fine-tuned matching)
  dominantColor: string; // hex

  // Screenshot brightness classification
  brightness: "dark" | "medium" | "light";

  // How colorful the screenshot is
  accentStrength: "vibrant" | "muted" | "grayscale";
};

type HueBucket =
  | "red" // 345-15°
  | "orange" // 15-45°
  | "yellow" // 45-75°
  | "green" // 75-165°
  | "teal" // 165-195°
  | "blue" // 195-255°
  | "purple" // 255-285°
  | "pink" // 285-345°
  | "neutral"; // low chroma, any hue
```

### Gradient Palette

```ts
type GradientPalette = {
  id: string; // "sunset-dark-001"

  // Tags for matching (brightness + hue + strength)
  tags: {
    brightness: "dark" | "medium" | "light";
    hue: HueBucket;
    strength: "vibrant" | "muted" | "grayscale";
  };

  // The actual palette colors (all pre-validated to work together)
  colors: {
    primary: string; // hex - dominant gradient color
    secondary: string; // hex - supporting color
    tertiary?: string; // hex - optional for mesh/complex gradients
    glow?: string; // hex - optional for radial/glow effects
  };

  // Reference hue for fine-tuned matching (OKLCH hue 0-360)
  referenceHue: number;

  // Which layouts this palette works well with
  compatibleLayouts: GradientLayout[];

  // Manual validation status
  validated: boolean;

  // Optional: variant name for multiple palettes in same bucket
  variant?: string; // "warm", "cool", "electric", etc.
};

type GradientLayout =
  | "linear-diagonal"
  | "linear-horizontal"
  | "linear-vertical"
  | "radial-center"
  | "radial-corner"
  | "mesh-simple"
  | "mesh-complex"
  | "conic";
```

### Palette Collection

```ts
type PaletteCollection = {
  version: string;
  palettes: GradientPalette[];

  // Index for fast lookup
  index: {
    byBrightness: Record<string, string[]>; // palette ids
    byHue: Record<HueBucket, string[]>;
    byStrength: Record<string, string[]>;
  };
};
```

## Implementation Phases

### Phase 1: Palette Definition & Generation

**Goal:** Create the initial set of palette candidates

1. Define anchor hues (9 buckets as above)
2. Define brightness classes (3)
3. Define accent strengths (3)
4. Write palette generation script that creates candidates:
   - For each combination, generate 2-4 palette variants using color theory
   - Output: ~150-250 palette candidates

**Deliverables:**

- `src/domain/gradient-palettes/types.ts` - Type definitions
- `src/domain/gradient-palettes/generation/` - Palette generation utilities
- `src/domain/gradient-palettes/data/candidates.json` - Raw generated palettes

### Phase 2: Playground Validation UI

**Goal:** Build UI to preview and validate palettes

1. Create `/playground/gradients` route
2. Display all palette candidates in a grid
3. For each palette, show all compatible layouts
4. Add controls:
   - Toggle `validated` status
   - Filter by tags (brightness/hue/strength)
   - Filter by validation status
5. Export validated palettes to production JSON

**Deliverables:**

- `app/playground/gradients/page.tsx` - Validation UI
- `src/domain/gradient-palettes/data/validated.json` - Curated output

### Phase 3: Signature Extraction

**Goal:** Replace complex color extraction with signature extraction

1. Simplify extraction to output `ColorSignature` only
2. Classify dominant hue into bucket
3. Classify brightness (average lightness)
4. Classify accent strength (max chroma)

**Deliverables:**

- `src/domain/gradient-palettes/extraction.ts` - Simplified extraction
- Tests for signature classification

### Phase 4: Palette Matching

**Goal:** Implement matching algorithm

1. Filter palettes by exact tag match (brightness + strength)
2. Score by hue proximity (referenceHue vs extracted hue)
3. Return best match (or fallback palette)
4. Support user preferences (warm/cool bias)

**Deliverables:**

- `src/domain/gradient-palettes/matching.ts` - Matching algorithm
- `src/domain/gradient-palettes/index.ts` - Public API

### Phase 5: Integration & Migration

**Goal:** Replace current gradient-generation with new system

1. Update `useGradientGeneration` hook to use new system
2. Keep old system as fallback during rollout
3. A/B test new vs old (feature flag)
4. Deprecate old `gradient-generation/` module

**Deliverables:**

- Updated hooks
- Feature flag integration
- Migration guide

## Palette Generation Strategy

Don't hand-craft 200 palettes. Instead:

### Step 1: Define Base Colors per Hue Bucket

```ts
const HUE_ANCHORS: Record<HueBucket, { h: number; variants: string[] }> = {
  orange: { h: 30, variants: ["sunset", "peach", "amber"] },
  blue: { h: 230, variants: ["ocean", "sky", "navy"] },
  // ...
};
```

### Step 2: Generate Palettes Programmatically

For each (hue, brightness, strength) combination:

1. Start with anchor hue
2. Generate primary color at appropriate lightness
3. Generate secondary via:
   - Analogous (±30° hue shift)
   - Complementary (180° shift, lower chroma)
   - Split-complementary (±150° shift)
4. Adjust chroma based on strength

### Step 3: Render All Candidates

On `/playground/gradients`, render every candidate with every compatible layout. Visual inspection reveals which work.

### Step 4: Curate

Mark `validated: true` on good ones. Delete or tweak bad ones. This is a one-time effort with occasional additions.

## Matching Algorithm Detail

```ts
function matchPalette(
  signature: ColorSignature,
  preferences?: { temperature?: "warm" | "cool" },
): GradientPalette {
  const { brightness, accentStrength, dominantHue } = signature;

  // 1. Filter by exact brightness + strength match
  let candidates = palettes.filter(
    (p) => p.tags.brightness === brightness && p.tags.strength === accentStrength && p.validated,
  );

  // 2. Prefer same hue bucket, but allow adjacent
  const sameHue = candidates.filter((p) => p.tags.hue === dominantHue);
  const adjacentHue = candidates.filter((p) => isAdjacentHue(p.tags.hue, dominantHue));

  candidates = sameHue.length > 0 ? sameHue : adjacentHue.length > 0 ? adjacentHue : candidates;

  // 3. Score by hue proximity
  candidates.sort(
    (a, b) =>
      hueDistance(a.referenceHue, signature.dominantHue) -
      hueDistance(b.referenceHue, signature.dominantHue),
  );

  // 4. Apply temperature preference if specified
  if (preferences?.temperature) {
    // Boost palettes with matching variant tag
    candidates.sort((a, b) => {
      const aMatch = a.variant === preferences.temperature ? -1 : 0;
      const bMatch = b.variant === preferences.temperature ? -1 : 0;
      return aMatch - bMatch;
    });
  }

  return candidates[0] ?? FALLBACK_PALETTE;
}
```

## Fallback Strategy

For edge cases where no palette matches well:

1. **Neutral fallback** - Use grayscale-compatible palette with temperature preference
2. **Generic vibrant** - Pre-validated "works with anything" palette (purple-pink gradient)
3. **User override** - Let user pick from a palette selector if auto-match fails

## File Structure

```
src/domain/gradient-palettes/
├── index.ts              # Public API: matchPalette(), getSignature()
├── types.ts              # Type definitions
├── extraction.ts         # ColorSignature extraction from images
├── matching.ts           # Palette matching algorithm
├── data/
│   ├── candidates.json   # Generated palette candidates (dev only)
│   └── validated.json    # Production palettes (curated)
└── generation/           # Scripts to generate candidates
    ├── anchors.ts        # Hue anchor definitions
    ├── generate.ts       # Palette generation script
    └── utils.ts          # Color math helpers
```

## Success Criteria

1. **Predictability** - Same screenshot always produces the same gradient
2. **Quality** - 100% of generated gradients are from validated palettes
3. **Coverage** - 95%+ of screenshots map to a "good" palette (not fallback)
4. **Performance** - Matching is faster than current color theory computation
5. **Debuggability** - Can easily identify which palette was used and why

## Open Questions

1. **How many palette variants per bucket?** Start with 2-3, expand based on coverage gaps
2. **Should users be able to pick palettes manually?** Probably yes for premium
3. **How to handle photos vs UI screenshots?** Photos may need different palettes (more complex colors)
4. **Versioning strategy?** When we add new palettes, how do we ensure existing exports don't change?

## Timeline Estimate

| Phase                         | Effort |
| ----------------------------- | ------ |
| Phase 1: Palette generation   | Small  |
| Phase 2: Playground UI        | Medium |
| Phase 3: Signature extraction | Small  |
| Phase 4: Matching algorithm   | Small  |
| Phase 5: Integration          | Medium |

## Next Steps

1. Review this plan and confirm approach
2. Start with Phase 1: type definitions and palette generation
3. Build Phase 2 playground UI to validate assumptions early
