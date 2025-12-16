# dopeshot — Product One-Pager

## Promise

Turn a raw product screenshot into a share-ready graphic in under 15 seconds, with defaults that already look postable.

## Who it's for

Indie hackers and small builders shipping fast, posting often, and wanting professional visuals without fiddling with design tools.

## Core flow

1. Upload a screenshot (PNG/JPG)
2. Auto-detect aspect, extract palette, select layout
3. Apply auto-matched background gradient
4. Optional: choose orientation, toggle effects (Grain/Glow/Grid), edit text
5. Export a PNG sized for Twitter/LinkedIn

## Current capabilities

- Smart upload: palette extraction and automatic layout selection
- Layouts: geometry-based options (formerly "Looks") with wireframe thumbnails
- Orientation selector: Horizontal, Vertical, Square aspect ratios
- Effects: independent toggles for Grain, Glow, Grid
- Backgrounds: auto gradients matched to screenshot palette
- Export: high-res PNG optimized for Twitter/LinkedIn

## In flight / near term

- Brand integration architecture (backgrounds accept brand tokens)
- Future vibe looks (Bay Area, Hacker, etc.) as curated combinations
- Additional text color options beyond the default safe pick

## Boundaries (intentional)

- Single-image flow; no batch export
- Twitter/LinkedIn formats only until multi-format work lands
- No saved brand kits or accounts yet; local-only experience
- Desktop-first; mobile is responsive but secondary
- No watermark until pricing is defined

## Performance targets

- First polished result in ≤3s; upload to export in ≤10s
- Color analysis <1s, render <2s, export <3s
