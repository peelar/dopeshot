import { ColorPalette } from "./types";
import { ColorToken } from "@/domain/layout/types";
import { getContrastTextColorFromPalette } from "@/domain/layout/gradients";
import { extractColorPaletteFromImage } from "./color-analysis";

export async function analyzeImageTextContrast(
  src: string,
): Promise<{ palette?: ColorPalette; textColor?: ColorToken }> {
  const palette = await extractColorPaletteFromImage(src);
  if (!palette) return {};

  return {
    palette,
    textColor: getContrastTextColorFromPalette(palette),
  };
}
