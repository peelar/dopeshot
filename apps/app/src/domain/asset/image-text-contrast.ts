import { analyzeColors } from "./analyze-colors";
import { getImageDataUrl } from "./image-data-url";
import { ColorPalette } from "./types";
import { getContrastTextColorFromPalette } from "@/domain/layout/gradients";
import { ColorToken } from "@/domain/layout/types";

export async function analyzeImageTextContrast(
  src: string,
): Promise<{ palette?: ColorPalette; textColor?: ColorToken }> {
  const dataUrl = await getImageDataUrl(src);
  if (!dataUrl) {
    return {};
  }

  const palette = await analyzeColors(dataUrl);
  if (!palette) {
    return {};
  }

  return {
    palette,
    textColor: getContrastTextColorFromPalette(palette),
  };
}
