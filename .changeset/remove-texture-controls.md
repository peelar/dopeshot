---
"dopeshot-app": patch
---

Simplify effects controls and remove texture selection

- Remove texture/pattern selection UI - grain texture is now always enabled for gradient and solid backgrounds
- Remove corners toggle - corners are always rounded
- Simplify effects section to show only relevant controls per layout:
  - Peak layouts: Fade toggle (off by default)
  - Spotlight layouts: Soft Glass toggle (off by default)
  - Backdrop layouts: Soft Glass toggle (on by default)
