---
"dopeshot-app": minor
---

Activate OKLCH color space interpolation for all gradient types. Gradients now render with perceptually uniform color transitions — no more muddy midpoints between complementary colors. Mesh blob layers and aurora wave layers also benefit from OKLCH, maintaining vibrant hue and chroma as they fade. Added support for hue interpolation keywords (shorter/longer/increasing/decreasing) for future gradient styles.
