import type { ColorExtractionResult, ClassifiedColor } from "./color-extraction";
import { labDistance } from "./utils";

export type GradientStrategy = "single-accent" | "multi-accent" | "monochrome" | "fallback";

export type PaletteMood = {
  isGrayscale: boolean;
  isLowContrast: boolean;
  isHighlyColorful: boolean;
  averageSaturation: number;
  lightnessRange: number;
};

export function analyzePaletteMood(palette: ColorExtractionResult): PaletteMood {
  const saturations = palette.colors.map((color) => color.saturation);
  const lightnesses = palette.colors.map((color) => color.lightness);
  const averageSaturation = saturations.length
    ? saturations.reduce((sum, value) => sum + value, 0) / saturations.length
    : 0;
  const maxSaturation = Math.max(...saturations, 0);
  const maxLight = Math.max(...lightnesses, 0);
  const minLight = Math.min(...lightnesses, 0);
  const lightnessRange = maxLight - minLight;

  return {
    isGrayscale: maxSaturation < 0.25,
    isLowContrast: lightnessRange < 0.22,
    isHighlyColorful: palette.accentColors.length >= 4 || averageSaturation > 0.65,
    averageSaturation,
    lightnessRange,
  };
}

export function determineStrategy(
  palette: ColorExtractionResult,
  mood: PaletteMood,
): GradientStrategy {
  const strongAccents = getStrongAccentColors(palette, mood);
  const accentPopulation = strongAccents.reduce((sum, entry) => sum + entry.population, 0);
  if (strongAccents.length >= 2 && accentPopulation >= 0.25) {
    return "multi-accent";
  }
  if (strongAccents.length >= 1) {
    return "single-accent";
  }
  if (palette.baseColors.length > 0 || palette.colors.length > 0) {
    return "monochrome";
  }
  return "fallback";
}

export function getStrongAccentColors(
  palette: ColorExtractionResult,
  mood: PaletteMood,
): ClassifiedColor[] {
  const threshold = mood.isHighlyColorful ? 0.25 : 0.35;
  return [...palette.accentColors]
    .filter((color) => color.saturation >= threshold)
    .sort((a, b) => b.population - a.population)
    .slice(0, mood.isHighlyColorful ? 3 : 4);
}

export function selectAccentPair(
  accentColors: ClassifiedColor[],
): [ClassifiedColor, ClassifiedColor] | null {
  if (accentColors.length < 2) {
    return null;
  }

  let bestPair: [ClassifiedColor, ClassifiedColor] | null = null;
  let bestScore = 0;

  for (let i = 0; i < accentColors.length; i += 1) {
    for (let j = i + 1; j < accentColors.length; j += 1) {
      const first = accentColors[i];
      const second = accentColors[j];
      const distance = labDistance(first.hex, second.hex);
      const score = distance * (first.population + second.population);
      if (score > bestScore) {
        bestScore = score;
        bestPair = [first, second];
      }
    }
  }

  return bestPair;
}




