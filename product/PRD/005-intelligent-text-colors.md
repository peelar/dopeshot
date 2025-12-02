---
status: TODO
---

# Intelligent Text Color Derivation

## Objective

Provide users with 4 smart text color options derived from their screenshot gradient: a safe default, a contrast-aware option, an accent-based designer choice, and a vibrant highlight color—all automatically calculated with readable contrast.

## Background

We currently derive a single text color (`getContrastTextColor`) by checking contrast ratio against gradient stops, defaulting to either slate-50 (light) or slate-900 (dark). While functional, this binary approach misses opportunities to create more expressive, on-brand text treatments that leverage the rich palette we've already extracted from the user's screenshot.

PRD-003 established our gradient generation system using node-vibrant to extract dominant and accent colors. That same palette can power intelligent text color suggestions that feel cohesive with the gradient while maintaining WCAG contrast standards.

## Problem Statement

Users get only one text color option (light or dark gray), even when their gradient contains rich accent colors that could make headlines pop. There's no way to leverage vibrant yellows, blues, or other accent hues for text without manual color picking. The current approach is safe but bland—it doesn't help users create standout social covers.

## Goals / Non-Goals

Goals:
- Offer 4 distinct text color options automatically derived from the gradient/palette
- Ensure all options meet WCAG AA contrast (4.5:1 for body, 3:1 for large text)
- Make the "vibrant" option feel bold without sacrificing readability
- Reuse existing color extraction pipeline (node-vibrant + gradient generation)

Non-Goals:
- Manual color picker UI
- Per-text-element color control (headline vs body)
- Real-time contrast validation against every pixel (check against gradient stops only)

## Users & Use Cases

User uploads a screenshot with a distinctive color (e.g., yellow branding, blue accent). The tool:
1. Derives a safe default (current behavior: light/dark gray)
2. Offers a gradient-aware option (white for dark gradients, dark for light gradients)
3. Suggests an accent-based color that pulls from the screenshot's personality
4. Provides a vibrant highlight option for bold headlines

User can toggle between these 4 presets in the Design sidebar. No guesswork—each option is contrast-validated and purposeful.

## Proposed Solution

Extend `getContrastTextColor` into a new function `deriveTextColorOptions` that returns an array of 4 `ColorToken` or hex values:

### Option 1: Safe Default (current behavior)
- Binary choice: slate-50 or slate-900 based on weakest contrast across gradient stops
- Guarantees readability in all cases

### Option 2: Gradient-Aware High Contrast
- If gradient average luminance < 0.4 → return pure white (#ffffff)
- If gradient average luminance ≥ 0.4 → return deep slate (#0f172a)
- Slightly more aggressive than Option 1 for maximum pop

### Option 3: Accent-Driven Designer Color
- Extract the most vibrant accent from the palette (highest chroma/saturation)
- Convert to OKLCH/HCL, shift lightness to ensure contrast meets WCAG AA
- Maintain hue and chroma for brand personality
- Example: screenshot has blue accent → derive readable bright blue for text

### Option 4: Vibrant Highlight (Yellow-Aware)
- If palette contains a yellow/warm accent (hue 45–75°):
  - Derive a high-contrast yellow (darken or lighten based on gradient darkness)
  - Ensure chroma stays high for vibrancy
- If no yellow detected:
  - Use the brightest accent color with boosted saturation
- Special handling for yellow: common brand color but notoriously low contrast

### Contrast Validation
All 4 options must pass WCAG AA (4.5:1) against the weakest gradient stop (reuse existing `contrastRatio` logic). If an accent-based color fails, iteratively adjust lightness in OKLCH space until it passes.

### UI Integration
Design sidebar shows 4 color chips labeled:
- "Default" (Option 1)
- "High Contrast" (Option 2)
- "Accent" (Option 3)
- "Vibrant" (Option 4)

User clicks to apply. Current text color is visually indicated.

## Requirements

New Function:
- `deriveTextColorOptions(gradient: CustomGradient, palette: ColorPalette): TextColorOption[]`
- Returns 4 options with: `{ label: string, color: ColorToken | string, contrastRatio: number }`

Color Space Conversion:
- Use existing `hexToRgb` + add RGB→OKLCH helpers (culori or simple LCH)
- Lightness adjustment loop to hit 4.5:1 contrast minimum

Palette Inspection:
- Identify vibrant accent (highest chroma in OKLCH)
- Detect yellow hue range (45–75° in LCH/OKLCH)
- Calculate average gradient luminance for Option 2

Integration Points:
- Call `deriveTextColorOptions` in `use-color-analysis.ts` after gradient generation
- Store all 4 options in layout config or separate state
- Update Design sidebar to render color chips + click handler

Fallback:
- If palette extraction fails, fall back to current binary behavior (light/dark gray)

## UX Notes & Copy

Design Sidebar Section:
**Text Color**
[4 circular color chips in a row]
- Chip 1: Light/dark gray (current default)
- Chip 2: Pure white or deep slate
- Chip 3: Accent color chip (dynamically colored)
- Chip 4: Vibrant/yellow chip (dynamically colored)

Hover tooltip labels:
- "Safe Default"
- "High Contrast"
- "Accent Color"
- "Vibrant Highlight"

No visible contrast ratios in UI (validated behind the scenes). User picks visually.

## Success Metrics

- Users select non-default text colors in 30%+ of exports
- Zero user complaints about unreadable text from derived options
- Vibrant option leverages screenshot accent colors in 70%+ of colorful uploads
- Average time from upload to export remains < 30 seconds (no performance regression)
