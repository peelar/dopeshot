---
status: TODO
---

# Pattern Overlays

## Objective
- Add curated pattern overlays on gradients (grain, diagonal fade, geometric texture, code rain) with an `Auto` default, while keeping the Design sidebar minimal and transparent.

## Background
- We currently ship only grain on gradients. Users like the texture but cannot choose or disable it easily.
- Adding more overlays risks sidebar clutter and hidden state if tied to new tabs.
- Patterns should feel automatic, align with gradients, and remain easy to turn off.

## Problem Statement
- Single texture + no control limits expression.
- If we add more overlays without a clear control, users won’t know what’s applied or how to remove it.
- We need multiple pattern choices without bloating the UI or breaking the “do nothing, looks good” promise.

## Goals / Non-Goals
**Goals**
- Single-choice pattern control with an `Auto` default that picks a good overlay per gradient/layout.
- Keep control inside the existing Background area (no new sidebar tabs).
- Make active pattern visible and easy to clear (`None`).
- Patterns must preserve text readability and export fidelity.

**Non-Goals**
- Intensity sliders, rotation controls, or user-uploaded patterns.
- Multiple patterns at once.
- Pattern editing per breakpoint.

## Users & Use Cases
- New users: drop a screenshot, see a tasteful pattern by default, optionally turn it off.
- Repeat users: pick a vibe (grain vs geometric vs code rain) that matches their brand.
- Content sharers: ensure overlays work across landscape/portrait templates without extra steps.

## Proposed Solution
- **Control placement:** Add a `Pattern` row inside the Background section of the Design sidebar.
- **Options (radio chips with thumbnails):** `Auto` (default), `None`, `Grain`, `Fade` (diagonal), `Geo` (dots/triangles), `Rain` (digital rain vibe).
- **Auto behavior:** Chooses a pattern based on gradient contrast, colorfulness, and layout (e.g., grain for flat gradients, fade for wide layouts, geo when high chroma, rain when dark/high-contrast). Auto re-evaluates on upload/palette change unless the user picks a specific pattern.
- **Interaction with Looks:** Looks can set a pattern; if so, show a subtle banner “Applied via Look: Beach Pop · Reset” near Background. User overrides switch the state to `Custom`.
- **Persistence:** Pattern choice stored in layout/config state; survives template/layout switches and refresh.

## Requirements
- Add `patternId` (and `patternMode: auto|manual`) to config/state; default to `auto`.
- UI shows pattern chips only (no sliders); exactly one option active.
- `Auto` must never reduce text contrast below current guarantees; fallback to `None` if unsafe.
- Accessible radiogroup: arrow-key navigation, focus ring, tooltips.
- Responsive: chips wrap or collapse to a pill dropdown on narrow widths.
- Export matches on-canvas pattern; no perf regressions on render.
- When a Look applies a pattern, display applied state and allow reset to `Auto` or `None`.

## UX Notes & Copy
- Label: `Pattern`.
- Chips text: `Auto`, `None`, `Grain`, `Fade`, `Geo`, `Rain`.
- Helper text (muted, 12px): “Patterns sit on top of the gradient.”
- Tooltip for Auto: “Picks the best texture for your gradient.”
- Reset link when a Look applied: “Applied via Look · Reset”.

## Success Metrics
- ≥50% of sessions leave pattern on `Auto`.
- ≥25% of users try a non-default pattern at least once.
- <2% of feedback mentions “can’t find/turn off pattern”.
- No increase in unreadable text issues tied to patterns.
