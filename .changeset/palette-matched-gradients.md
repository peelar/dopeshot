---
"dopeshot-app": minor
---

Introduce palette-matched gradients driven by screenshot color analysis

- Extract dominant/accent/muted hues from screenshots for gradient matching
- Generate six gradient styles with multi-hue variation and alternate secondary palettes
- Add gradient playground for previewing palettes
- Make radial "beam" gradient directional for Peak layouts and shift it downward
- Avoid showing fallback gradients while screenshot analysis is in progress
