# Brand Palette Generator

Generates brand-consistent color gradients from a user's accent color and light/dark mode preference.

## Features

- **OKLCH Color Space**: Uses perceptually uniform color manipulation for better color transitions
- **Mode-Aware**: Generates appropriate base colors for light and dark modes
- **Color Harmony**: Produces complementary and analogous color combinations
- **Readable**: Ensures sufficient contrast for text readability
- **Consistent**: Deterministic output for same inputs

## Usage

```typescript
import { generateBrandGradients } from "@/domain/brand-palette";

// Generate gradients for dark mode
const darkGradients = generateBrandGradients({
  accentColor: "#FF6B35",
  mode: "dark",
});

// Generate gradients for light mode
const lightGradients = generateBrandGradients({
  accentColor: "#FF6B35",
  mode: "light",
});

// darkGradients and lightGradients are arrays of 2 AdvancedGradient objects
console.log(darkGradients[0]); // Primary brand gradient
console.log(darkGradients[1]); // Secondary brand gradient
```

## Output Structure

Each gradient returned is an `AdvancedGradient` object:

```typescript
{
  type: "linear",
  stops: [
    { color: "#1a1a1a", position: 0 },    // Base color
    { color: "#ff6b35", position: 50 },   // Accent color
    { color: "#35b4ff", position: 100 }   // Complementary color
  ],
  angle: 135,
  colorSpace: "oklch",
  direction: "135deg"
}
```

## Algorithm

1. **Parse Accent Color**: Converts hex to OKLCH color space
2. **Adjust for Mode**:
   - Dark mode: Increases lightness for visibility
   - Light mode: Decreases lightness for contrast
3. **Generate Harmonies**:
   - Complementary: 180° hue rotation
   - Analogous: 30° hue rotation
4. **Create Base Colors**:
   - Dark mode: Low lightness (charcoal/navy)
   - Light mode: High lightness (cream/white)
5. **Compose Gradients**:
   - Gradient 1: Base → Accent → Complementary (135°)
   - Gradient 2: Base → Analogous → Accent (45°)

## Color Theory

- **Complementary Colors**: Opposite on the color wheel (180° apart), provide high contrast
- **Analogous Colors**: Adjacent on the color wheel (~30° apart), create harmony
- **OKLCH**: Perceptually uniform color space (Lightness, Chroma, Hue) for consistent gradients

## Testing

Run tests with:

```bash
pnpm test:ui tests/ui/brand-palette-generator.test.ts
```

Test coverage includes:
- Basic functionality (2 gradients returned)
- Valid AdvancedGradient structures
- Color harmony (complementary/analogous)
- Mode-specific behavior (dark/light bases)
- Edge cases (pure colors, neutrals, extremes)
- Consistency and readability
