import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { customGradientToCss } from "@/domain/layout/gradients";
import { getGradientById } from "@/domain/layout/gradient-presets";
import { tokenToCssColor } from "@/components/templates/shared/color-utils";

export function getBackgroundStyle(config: LayoutConfig, assetMap: Map<string, Asset>): string {
  if (config.background?.type === "gradient") {
    if (config.background.customGradient) {
      return customGradientToCss(config.background.customGradient);
    }

    const gradient = getGradientById(config.background.value);
    if (gradient) {
      return gradient.value;
    }
  } else if (config.background?.type === "image") {
    const bgAsset = assetMap.get(config.background.value);
    if (bgAsset) {
      return `url(${bgAsset.url})`;
    }
  } else if (config.background?.type === "solid") {
    return tokenToCssColor(config.background.value);
  }

  const bgColor1 = tokenToCssColor(config.colors.background);
  const bgColor2 = tokenToCssColor(config.colors.accent);
  return `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`;
}
