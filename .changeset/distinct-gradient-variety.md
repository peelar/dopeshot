---
"dopeshot-app": patch
---

Improve gradient variety and ambient gradient quality:

- **Monochromatic gradients**: Slots 1-3 now use distinct color harmonies (analogous, complementary, split-complementary) instead of just lightness variations, ensuring visual variety even with dark dashboards that have minimal accent colors.

- **Ambient gradients**: Redesigned for stronger contrast and better color selection:
  - Dark ambient: smooth transition from pure black to very dark accent color (-0.7 lightness)
  - Light ambient: smooth transition from pure white to very light accent color (+0.6 lightness)
  - Now prioritizes vibrant color from screenshot (vibrant > accent > hero) for more impactful results
