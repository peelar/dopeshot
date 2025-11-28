import { Vibrant } from "node-vibrant/browser";
import { ColorPalette } from "./types";

export async function analyzeColors(dataUrl: string): Promise<ColorPalette | undefined> {
  try {
    if (!dataUrl || typeof dataUrl !== "string") {
      return undefined;
    }

    // Use node-vibrant to extract color palette
    const palette = await Vibrant.from(dataUrl).getPalette();

    // Extract colors from palette, with fallbacks
    const dominant = palette.DarkVibrant?.hex ?? palette.Vibrant?.hex ?? "#6366f1";
    const accent = palette.Vibrant?.hex ?? palette.LightVibrant?.hex ?? "#8b5cf6";
    const muted = palette.Muted?.hex ?? palette.DarkMuted?.hex;
    const vibrant = palette.LightVibrant?.hex ?? palette.Vibrant?.hex;

    const result: ColorPalette = {
      dominant,
      accent,
      ...(muted && { muted }),
      ...(vibrant && { vibrant }),
    };

    return result;
  } catch (error) {
    console.error("Color analysis error:", error);
    return undefined;
  }
}
