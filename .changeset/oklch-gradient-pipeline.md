---
"dopeshot-app": minor
---

Complete OKLCH-based gradient generation pipeline

New gradient pipeline with 6 visually distinct gradient types (each uses different color harmonies):

1. **Mesh Gradient** - Organic multi-color blobs using all harmonies
2. **Split-Complementary Linear** - 150° hue rotation for sophisticated contrast
3. **Triadic Radial** - 120° hue rotation, radial gradient type
4. **Multi-Stop Diagonal** - Three colors (base + triadic + complementary)
5. **Analogous Cool Linear** - -30° hue rotation (cool tones)
6. **Warm Analogous Linear** - +30° hue rotation (warm tones)

Key improvements:

- **Adaptive lightness**: Dark screenshots → darker gradients (12-40%), light screenshots → lighter gradients (50-90%)
- Harmonious palette expansion using color theory (analogous, complementary, triadic, monochromatic)
- Replaced chroma-js with culori for perceptually uniform color manipulation
- Each gradient type has fundamentally different visual character
- Neutral/grayscale palettes now get injected color variety
