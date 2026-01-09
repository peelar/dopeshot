import { LayoutConfig, CustomGradient } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import {
  customGradientToCss,
  isAdvancedGradient,
  isLegacyGradient,
  isMeshGradient,
} from "@/domain/layout/gradients";
import { getGradientById } from "@/domain/layout/gradient-presets";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";

type LayoutGeometry =
  | { type: "radial"; direction: string }
  | { type: "linear"; angle: number };

/**
 * Get layout-specific gradient geometry based on layout type and variant.
 * This allows the same gradient colors to render differently per layout.
 *
 * Note: We use linear gradients for all layouts because the 3-stop gradient
 * structure (color → dark → color) doesn't work well with radial gradients
 * (creates a glow/ring effect instead of smooth coverage).
 */
function getLayoutGeometry(layoutId: string, variant?: string): LayoutGeometry {
  // Spotlight: diagonal toward screenshot side
  if (layoutId.startsWith("hero-center")) {
    // Left variant: text on left, screenshot on right → gradient flows left-to-right
    // Right variant: text on right, screenshot on left → gradient flows right-to-left
    return {
      type: "linear",
      angle: variant === "right" ? 270 : 90,
    };
  }

  // Peak: linear perpendicular to screenshot edge
  if (layoutId.startsWith("popup-gradient")) {
    const angles: Record<string, number> = {
      left: 90,
      right: 270,
      center: 180,
    };
    return { type: "linear", angle: angles[variant ?? "center"] ?? 180 };
  }

  // Backdrop: vertical gradient for centered screenshot
  if (layoutId === "adaptive-stage") {
    return { type: "linear", angle: 180 };
  }

  // Default: diagonal linear
  return { type: "linear", angle: 135 };
}

/**
 * Extract gradient stops as a CSS string from a CustomGradient
 */
function getGradientStopsString(gradient: CustomGradient): string {
  if (isAdvancedGradient(gradient)) {
    return gradient.stops
      .map((stop) => {
        if (stop.position !== undefined) {
          const position = stop.position <= 1 ? `${stop.position * 100}%` : `${stop.position}%`;
          return `${stop.color} ${position}`;
        }
        return stop.color;
      })
      .join(", ");
  }

  if (isLegacyGradient(gradient)) {
    return `${gradient.from}, ${gradient.to}`;
  }

  return "#6366f1, #8b5cf6";
}

/**
 * Convert gradient to CSS with layout-specific geometry.
 * Colors come from the stored gradient; geometry is determined by layout type.
 */
function gradientToCssWithLayout(
  gradient: CustomGradient,
  layoutId: string,
  variant?: string
): string {
  // Mesh gradients have their own layered geometry - bypass layout adjustments
  // They use multiple overlaid radial gradients that shouldn't be modified
  if (isMeshGradient(gradient)) {
    return customGradientToCss(gradient);
  }

  // Aurora gradients (4+ stops) also have specific layered structure
  if (isAdvancedGradient(gradient) && gradient.stops.length >= 4) {
    return customGradientToCss(gradient);
  }

  const stops = getGradientStopsString(gradient);
  const geometry = getLayoutGeometry(layoutId, variant);

  if (geometry.type === "radial") {
    return `radial-gradient(${geometry.direction}, ${stops})`;
  }
  return `linear-gradient(${geometry.angle}deg, ${stops})`;
}

export function getBackgroundStyle(config: LayoutConfig, assetMap: Map<string, Asset>): string {
  if (config.background?.type === "gradient") {
    const gradient =
      config.background.customGradient ?? getGradientById(config.background.value)?.gradient;

    if (gradient) {
      // Apply layout-specific geometry at render time
      return gradientToCssWithLayout(gradient, config.layoutId, config.variant);
    }
  } else if (config.background?.type === "metric") {
    return tokenToCssColor(config.colors.background);
  } else if (config.background?.type === "image") {
    const bgAsset = assetMap.get(config.background.value);
    if (bgAsset) {
      // Use full shorthand so image covers the canvas without repeating or auto sizing
      return `url(${bgAsset.url}) center center / cover no-repeat`;
    }
  } else if (config.background?.type === "solid") {
    return tokenToCssColor(config.background.value);
  }

  const bgColor1 = tokenToCssColor(config.colors.background);
  const bgColor2 = tokenToCssColor(config.colors.accent);
  return `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`;
}
