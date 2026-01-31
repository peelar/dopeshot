import { ColorPalette } from "./types";
import { ColorToken } from "@/domain/layout/types";

/**
 * Stub for image text contrast analysis - color extraction is disabled.
 *
 * TODO: Re-implement when palette-based gradient system is built.
 * See thoughts/plans/09-palette-based-gradient-system.md
 */
export async function analyzeImageTextContrast(
  _src: string,
): Promise<{ palette?: ColorPalette; textColor?: ColorToken }> {
  // Color analysis disabled - return empty result
  // Static gradients are used instead
  return {};
}
