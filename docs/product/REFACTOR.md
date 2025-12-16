# DopeShot Refactor: Architecture Redesign

## Overview

This refactor separates conflated "looks" into clean concerns: layouts (geometry), effects (treatments), and backgrounds (surfaces). The architecture prepares for future brand integration without building brand UI yet.

## Separation of Concerns

### Layouts (Geometry)
- Control positioning, sizing, and aspect ratios
- Previously called "Looks" (Popup, Split, etc.)
- Wireframe thumbnails show structure, not style
- Three aspect ratio modes: Horizontal, Vertical, Square

### Effects (Treatments)
- Visual enhancements applied to layouts: Grain, Glow, Grid
- Previously embedded in "Style" dropdown with Variants toggle
- Moved to sidebar as independent effect toggles
- Can be combined or disabled independently

### Backgrounds (Surfaces)
- Auto-extracted gradients matched to screenshot palette
- Foundation for future brand integration (brand colors, patterns)
- No UI changes in this phase; architecture prep only

## Implementation Phases

| Phase | Change | Impact |
|-------|--------|--------|
| 01 | Rename Looks → Layouts | Terminology + wireframe thumbnails |
| 02 | Flatten Variants into Rail | Eliminate toggle, expand layout options |
| 03 | Move Style to Sidebar | Grain/Glow/Grid become effect toggles |
| 04 | Add Orientation Selector | H/V/Square aspect ratio control |
| 05 | Remove Typography Dropdown | Hardcode font, delete selector |
| 06 | Brand Integration Prep | Architecture for future brand tokens |

## Dependencies

- Phases 01 and 02 can execute in either order
- Phase 03 depends on 02 (Variants toggle must be gone)
- Phases 04 and 05 are independent
- Phase 06 should be last (touches background logic)

## Non-Goals (This Phase)

- Vibe looks (Bay Area, Hacker, etc.) remain future work
- Brand profile UI or onboarding stays out of scope
- Payment integration not included
- New asset types beyond Screenshot/Code deferred

## Architecture Goals

1. **Clear mental model**: Layout defines structure, effects add polish, backgrounds set mood
2. **Brand-ready**: Background system can accept brand tokens without UI refactor
3. **Composability**: Effects work independently across all layouts
4. **Speed preserved**: Changes maintain <3s first result, <10s upload-to-export

## Success Criteria

- Layout selection shows structure, not styled previews
- Effect toggles work uniformly across all layouts
- Background extraction remains automatic with palette matching
- No regression in render performance or export time
- Codebase ready for brand token injection (architecture only)
