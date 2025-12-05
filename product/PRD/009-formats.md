---
status: DRAFT
---

# Formats (Output Frames)

## Objective
- Make Formats a first-class control that defines canvas size/aspect and safe areas while preserving the active Look (style) and user content.
- Enable users to reuse the same Look across formats (e.g., Terminal look on Blog Cover and LinkedIn Header) with smart template variants (screenshot-forward vs avatar-forward).

## Background
- Users need different outputs (LinkedIn header, blog cover, Substack, social posts) but want a consistent vibe (Look) without rebuilding.
- Current placement of formats is secondary; users may not notice what size they’re exporting.
- Templates should stay automatic; Looks remain style; Formats set the frame.

## Problem Statement
- Changing size/aspect isn’t obvious; users risk exporting the wrong format.
- Asset expectations differ per format (screenshot vs avatar) and need smart fallbacks.
- We must not break the chosen Look when switching formats.

## Goals / Non-Goals
**Goals**
- First-class Format selector with clear current format + size.
- Format switching preserves the active Look, text, and layout toggle (when available).
- Smart template variants per format (screenshot-forward vs avatar-forward) without exposing templates directly.
- Clear defaults for top formats; overflow for the rest.

**Non-Goals**
- Per-format color changes to Looks.
- Exposing templates as a user-facing rail.
- Complex per-format fine-tuning beyond size/aspect-safe zones.

## Users & Use Cases
- Exporting a blog post cover with a screenshot using Terminal Look.
- Switching to a LinkedIn header with no screenshot; using avatar-forward variant while keeping Terminal Look.
- Exporting a Twitter header or Instagram post with the same Look for brand consistency.

## Proposed Solution
- **Format selector placement:** Just under the Looks rail in Design, mirrored near the Export CTA (e.g., “Format: LinkedIn Header · 1584×396”). Primary formats shown inline; “More formats” opens a drawer/sheet with the full list.
- **Primary formats:** Blog Cover (1200×628), LinkedIn Header (1584×396), Twitter/X Header (1500×500), Substack/Newsletter Cover (1200×600), Instagram Post (1080×1080), Story/Reel (1080×1920). Expandable list in overflow.
- **Behavior:** Switching formats resizes the canvas and may swap to the best template variant (screenshot-forward vs avatar-forward) but keeps the active Look, text, and layout toggle. No Look token changes per format.
- **Asset fallbacks:** If a format expects a screenshot and none exists, use avatar/text-forward variant and prompt for the asset. Look styling still applies.
- **State clarity:** Show the current format name + size near the Export CTA. Export always uses the active format.

## Requirements
- Add `formatId` (e.g., `linkedin-header`, `blog-cover`) to config/state with size metadata.
- Format switch updates canvas size/aspect and picks a template variant automatically (based on available assets: screenshot vs avatar). Must not alter `lookId`, text, or manual layout choice.
- UI: Inline chip/selector under Looks with a “More formats” drawer; mirrored summary near Export. Keyboard-accessible.
- Safe areas per format (padding, headline width) applied automatically by template variants.
- Export must respect the active format dimensions and the active Look without visual drift.

## UX Notes & Copy
- Label: `Format`.
- Helper (muted, 12px): “Output size. Keeps your Look.”
- Format chips show name + size (e.g., “LinkedIn Header · 1584×396”).
- Missing-asset prompt: “Add a screenshot to fill this format” or “Add a face/avatar.”

## Open Questions
- Do we need per-format “featured asset” preference (screenshot vs avatar) override?
- Should we allow pinning favorite formats to the top row?
- How to handle custom dimensions? (Possibly via a “Custom” entry in the drawer, out of scope for MVP.)
