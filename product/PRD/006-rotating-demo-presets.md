---
status: TODO
---

# Rotating Demo Presets

## Objective
Create a delightful first-impression experience by rotating through multiple pre-configured demo states (screenshot + text + effects) instead of showing a single static demo on initial load.

## Background
Currently, the app loads a single hardcoded demo state in `hooks/atoms.ts`:
- One screenshot (`/demo.png`)
- Fixed text ("Bring the heat" / "Drop some vibes and tell the story")
- Popup Gradient template with center variant
- Custom gradient with grain enabled
- Violet accent, slate-900 background

This single demo may not resonate with all users. Showcasing variety on first visit helps users understand the tool's range and increases engagement.

## Problem Statement
The demo experience is static and shows only one style. Users don't see the breadth of what's possible (different templates, effects like glass vs grain, various color schemes). We're missing an opportunity to inspire and demonstrate capability.

## Goals / Non-Goals
**Goals:**
- Define 3 distinct demo presets, each with its own screenshot, text, gradient/effects, and template configuration
- Randomly select one preset on initial app load
- Ensure presets showcase different capabilities (grain vs glass frame, different templates, varied color palettes)
- Keep demo data co-located and easy to update

**Non-Goals:**
- User ability to cycle through demos after initial load (future consideration)
- Demo persistence across sessions
- More than 3 presets in first release

## Users & Use Cases
**Primary user:** First-time visitor exploring the tool

**Use case:** User lands on the app and immediately sees an eye-catching, complete example. On subsequent visits or refreshes, they may see a different demo, reinforcing the tool's versatility.

## Proposed Solution
Create a `domain/demo/presets.ts` module with:
1. Type definition for a demo preset containing:
   - Screenshot asset (url, dimensions, metadata)
   - Initial layout config (template, variant, text, colors, background, effects)
   - Any preset-specific overrides (frame preset, grain enabled, etc.)

2. Array of 3 demo presets:
   - **Preset 1** (current demo): "Bring the heat" with popup-gradient, grain enabled, dark purple gradient
   - **Preset 2**: Glass frame showcase with soft-glass preset, bright/clean aesthetic, different template
   - **Preset 3**: Screenshot-focused layout with bold gradients, different text style

3. Export `getRandomDemoPreset()` function that randomly selects one preset

4. Update `hooks/atoms.ts` to call `getRandomDemoPreset()` when creating initial config and assets

## Requirements
**Functional:**
- Each preset must include all data needed to initialize `configAtom` and `assetsAtom`
- Random selection must be truly random (Math.random-based, no weighted logic initially)
- Presets must work with existing color analysis pipeline (colorPalette can be pre-computed or left for runtime)

**Technical:**
- Demo screenshots must be stored in `/public` (e.g., `/demo-1.png`, `/demo-2.png`, `/demo-3.png`)
- Type safety: preset shape should align with `LayoutConfig` and `Asset` types
- No breaking changes to existing state management

**Data quality:**
- Each preset showcases a different template or variant
- Text must be concise, inspiring, and avoid tech jargon (per agents.md rule)
- Screenshots should be high-quality, relevant product/app captures

## UX Notes & Copy
**Preset 1 (existing):**
- Template: Popup Gradient, center variant
- Text: "Bring the heat" / "Drop some vibes and tell the story"
- Style: Dark, vibrant, grain enabled

**Preset 2 (glass showcase):**
- Template: Adaptive Screenshot or Hero Center
- Text: "Polished and ready" / "Clarity meets design"
- Style: Light/clean, soft-glass frame preset, no grain

**Preset 3 (bold focus):**
- Template: Popup Gradient or Adaptive Screenshot, focused variant
- Text: "Stand out instantly" / "Your product, amplified"
- Style: Bold gradient, screenshot-focused mode, rectangular shape

Copy must align with the "don't mention underlying tech" rule—no references to "glass effect" or "grain texture" in user-facing text.

## Success Metrics
- Increased engagement: users interact with customization controls after seeing diverse demos
- Anecdotal feedback: users mention variety or specific preset in testimonials/tweets
- Internal validation: each preset loads without errors and looks polished

## Release Plan
1. Create demo assets (3 screenshots)
2. Build `domain/demo/presets.ts` with typed preset array
3. Integrate `getRandomDemoPreset()` into `hooks/atoms.ts`
4. QA each preset individually and verify random rotation
5. Ship in single PR (low-risk, no user-facing breaking changes)

## Open Questions
- Should we pre-compute color palettes for demo assets to avoid initial analysis delay? (Recommendation: yes, for snappier first load)
- Do we want a way to force a specific preset via URL param for debugging/sharing? (Out of scope for v1)
- Should preset selection be seeded based on user agent or time of day? (No, keep truly random for v1)
