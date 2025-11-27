---
status: DRAFT
---

# Full Page Spotlight Template PRD

## Objective
- New template (proposed name: **Full Page Spotlight**) that celebrates a full-size screenshot as the hero while keeping light, unobtrusive branding.
- Keep the screenshot legible across wildly different aspect ratios (desktop, tablet, tall mobile) without clipping or awkward padding.
- Provide optional captioning that does not mask key areas of the image.

## Background
- Current compositions emphasize partial screenshots with heavy gradients. Users who want to showcase a whole page lack a clean, full-bleed option.
- Uploaded screenshots can vary from 16:9 desktop to tall mobile; forcing them into one ratio leads to cropping or tiny previews.

## Problem Statement
- Users need a way to show an entire page/screen without losing readability or introducing distracting UI chrome. The template must flex to the image’s aspect ratio while fitting within the export canvas.

## Goals
- The screenshot is the hero; everything else supports it.
- Fluid scaling: the image should grow as large as possible while respecting its native ratio and a consistent gutter.
- Gentle framing: subtle depth and background harmonize with the screenshot colors.
- Optional, minimal branding (logo + short caption) that never obscures critical content.

## Non-Goals
- Device mockups or 3D frames.
- Multi-image collages or carousels.
- Complex CTA layouts (single optional CTA only).

## Users & Use Cases
- Marketers announcing a new landing page or feature with a full-page capture.
- Product teams sharing dashboard/report visuals where details matter.
- Mobile teams publishing App Store/Play Store screenshots that need to stay tall.

## Experience Principles
- Full-bleed focus: prioritize the screenshot area with no heavy overlays.
- Adaptive letterboxing: use `object-fit: contain` with auto-generated gutters (gradient or solid) derived from palette analysis.
- Minimal noise: soft shadow (low/med/high), 6–12px corner radius, optional thin stroke for light-on-light cases.
- Safe branding: logo badge anchored outside the screenshot (top-left) and caption card anchored at the bottom or bottom-left with translucent backdrop.

## Layout & Behavior
- Canvas: 1280x720 export target; preview scales responsively in the playground.
- Screenshot container:
  - Max width ~92–96% of canvas; max height ~86–88% to preserve gutters.
  - Centers horizontally; vertical alignment biased slightly upward to make room for caption.
  - Uses letterboxing bars colored from palette (or default muted neutral) when aspect ratio doesn’t match canvas.
  - Shadow + radius (default 8px) with optional stroke toggle.
- Branding/caption:
  - Logo badge sits outside the image (top-left gutter), never covering screenshot pixels.
  - Caption card (title + subtitle and optional CTA pill) sits on a translucent strip at bottom-left or bottom-center, respecting minimum padding from image edges.
  - Caption can be hidden entirely; layout re-centers without leaving gaps.
- Empty state:
  - Screenshot area doubles as a drag-and-drop + click drop zone (“Drop your screenshot”) using the same validation as the main uploader.
  - Logo badge placeholder is also clickable/droppable to upload/replace a logo.

## Configurations
- Background: auto gradient from palette with manual override (solid or gradient).
- Frame: radius options (square, 8px, 16px), shadow intensity (low/medium/high), optional 1px stroke.
- Caption: toggle on/off, align left or center, text + optional CTA label.
- Logo: upload/replace, toggle visibility.

## Functional Requirements
- Accepts PNG/JPG/WebP up to 10MB via drag-and-drop or click on both screenshot and logo drop zones.
- Maintains aspect ratio; no cropping or distortion across export and preview.
- Palette analysis applies to background/letterbox by default; users can override.
- Accessible: drop zones focusable and keyboard-invokable; caption fields editable via keyboard.
- Export parity: exported image matches preview sizing (no hidden padding or shifts).

## Success Metrics
- Time to first export for full-page screenshots (baseline vs. Popup & Gradient) improves.
- Increase in exports that include tall (mobile) screenshots without manual cropping.
- Qualitative feedback: fewer mentions of “screenshot too small/cropped” for full-page use.

## Open Questions
- Should caption default to hidden or visible on first render?
- Do we need per-orientation presets (e.g., “Desktop fit”, “Mobile fit”) or is auto letterboxing enough?
- Should the background default to a solid neutral when palette analysis fails? 
