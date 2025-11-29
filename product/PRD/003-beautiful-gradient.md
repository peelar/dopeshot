---
status: TODO
---

# Objective

Define an adaptive gradient-generation system in DopeShot that builds high-quality, visually modern gradients using colors extracted from the uploaded screenshot (via node-vibrant), with additional logic to ensure gradients always look professional, bold, and social-media-ready.

# Background

DopeShot already extracts colors from screenshots using node-vibrant. That gives us semantic color cues: accent colors, dominant palette, and contrast hints. The new goal isn’t just to reuse screenshot colors, but to turn them into a designer-grade gradient, avoiding muddy mid-tones, low-contrast backgrounds, or gradients that fight with the image composition.

Modern gradient practices show that:

- Perceptually uniform colors (OKLCH/HCL/LCH) produce smoother ramps.
- Best gradients use 4–12 stops along a controlled hue and lightness path.
- Gradients must support layout: they frame the screenshot instead of overpowering it.

# Problem Statement

Raw colors from screenshots often look wrong when plugged into a naive gradient:

- RGB interpolation produces dead centers and muddiness.
- Dominant colors may clash with overlay text or UI elements.
- Highly neutral screenshots generate dull gradients.
- Users expect gradients to feel intentional and premium.

We need a system that transforms sampled colors into good gradients every time.

# Goals / Non-Goals

Goal is automatic, generative gradients that:

- Always look premium and intentional.
- Use the screenshot as the reference for palette.
- Adapt to aspect ratio (ties into layout PRD).
- Require no user decisions.

Not in scope:

- Manual gradient editing UI.
- User controls for direction or number of stops.
- Hand-curated swatches.

# Users & Use Cases

User uploads a screenshot. The tool detects its colors and instantly produces a designer-quality gradient that frames the screenshot correctly and enhances the composition. No design knowledge required. Works for SaaS dashboards, mobile mockups, marketing images, Twitter/PH/LinkedIn covers.

# Proposed Solution

Use node-vibrant to extract a palette of dominant colors and accents. Map that to a perceptual color space pipeline so gradients look smooth and intense rather than dull.

Key gradient behaviors:

- Detect accent and dominant colors differently. Accent becomes the “hero color” of the gradient; dominant becomes the base or background tone.
- Convert extracted RGB values to OKLCH/HCL for interpolation.
- Generate a multi-stop gradient along a controlled hue path.
- Add logic that boosts saturation or shifts lightness if the extracted palette is too neutral.
- If the palette is mostly grayscale with one accent, amplify the accent to become the primary theme color.

Examples of palette transformations:

- Neutral palette + one pop: gradient uses pop → deep neutral → darker shade.
- Multiple accents: choose a hue journey with a 60-120° arc.
- Screenshot already colorful: soften/flatten the region behind the screenshot and intensify the corners.

# Requirements

Color Pipeline:

- Sample colors using node-vibrant.
- Categorize primary, secondary, accent, and background colors.
- Convert extracted colors to OKLCH/HCL before gradient creation.
- Generate 5–12 intermediate stops automatically instead of two-color interpolation.
- Output Tailwind-compatible gradient syntax using arbitrary values.

Gradient Logic:

- Fallback when screenshot palette is too dark or unsaturated.
- Maintain readable regions behind text.
- Ensure smooth lightness transitions.
- Add contrast zones based on the layout logic (hero region darker or calmer).

Layout Integration:

- Gradient angle or type adapts to aspect ratio templates:
  vertical → diagonal,
  landscape → side-anchored radial,
  ultrawide → long-axis linear.

Screenshot-Aware Behavior:

- Detect screenshot bounding box and soften the background directly behind it.
- Place accent hue where the eye should be drawn (usually headline or CTA region).

Quality Rules:

- No muddy middle tones.
- Preserve saturation across the ramp.
- Avoid white+black brute interpolation.
- Smooth perceptual lightness curve.

# UX Notes & Copy

Everything happens instantly. Gradients never require user decisions. The moment the screenshot is dropped, the tool confidently generates a strong gradient and layout that feels designed.

Possible microcopy:
“Gradient generated from your screenshot colors.”
“Automatically styled using your image palette.”

No configuration. No visible “color picker” unless future versions allow editing.

# Success Metrics

In user tests, no one is forced to change colors manually to achieve a premium look. Covers built from random screenshots look good without art direction. The drop-to-export rate increases. Thumbnails created with default settings are good enough for social launch usage most of the time.

Success criteria:

- 90%+ gradients readable with screenshot and headline.
- No frequent user intention to “fix” gradient colors.
- Reduced time from upload to export.
