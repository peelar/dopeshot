import { LayoutConfig, CustomGradient } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import {
  customGradientToCss,
  isAdvancedGradient,
  isLegacyGradient,
} from "@/domain/layout/gradients";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";

/**
 * Check if a gradient is "simple" - meaning it's safe to override its geometry
 * based on layout type. Simple gradients are basic 2-color linear gradients
 * without any special rendering requirements.
 * 
 * Complex gradients (mesh, aurora, etc.) have their own
 * carefully designed geometry and should NOT be modified.
 */
function isSimpleGradient(gradient: CustomGradient): boolean {
  // Legacy gradients are always simple (just from/to colors)
  if (isLegacyGradient(gradient)) {
    return true;
  }

  if (isAdvancedGradient(gradient)) {
    // Has mesh layers (blob effects) - never modify
    if (gradient.meshLayers && gradient.meshLayers.length > 0) return false;
    
    // Aurora-style (4+ stops) - never modify
    if (gradient.stops.length >= 4) return false;
    
    // Radial or conic gradients have specific geometry - don't override
    if (gradient.type !== "linear") return false;
    
    // Simple 2-3 stop linear gradient - safe to adjust angle
    return true;
  }

  return false;
}

/**
 * Get layout-specific gradient angle based on layout type and variant.
 * Only used for simple gradients where we want the gradient direction
 * to complement the layout's visual flow.
 */
function getLayoutAngle(layoutId: string, variant?: string): number {
  // Spotlight: gradient flows toward screenshot side
  if (layoutId.startsWith("hero-center")) {
    return variant === "right" ? 270 : 90;
  }

  // Peak: linear perpendicular to screenshot edge
  if (layoutId.startsWith("popup-gradient")) {
    const angles: Record<string, number> = {
      left: 90,
      right: 270,
      center: 180,
    };
    return angles[variant ?? "center"] ?? 180;
  }

  // Backdrop: vertical gradient for centered screenshot
  if (layoutId === "adaptive-stage") {
    return 180;
  }

  // Default: diagonal
  return 135;
}

/**
 * Convert gradient to CSS, optionally adjusting geometry for layout context.
 * 
 * Simple gradients get their angle adjusted to match the layout's visual flow.
 * Complex gradients (mesh, aurora) are rendered as-is via customGradientToCss.
 */
function gradientToCssWithLayout(
  gradient: CustomGradient,
  layoutId: string,
  variant?: string
): string {
  if (isAdvancedGradient(gradient) && gradient.type === "radial" && gradient.layoutHint === "beam") {
    const adjusted = {
      ...gradient,
      direction: getBeamDirection(layoutId, variant),
    };
    return customGradientToCss(adjusted);
  }

  // Complex gradients: use canonical renderer directly (no modifications)
  if (!isSimpleGradient(gradient)) {
    return customGradientToCss(gradient);
  }

  // Simple gradients: extract colors and apply layout-specific angle
  const angle = getLayoutAngle(layoutId, variant);
  
  if (isLegacyGradient(gradient)) {
    return `linear-gradient(${angle}deg, ${gradient.from}, ${gradient.to})`;
  }

  // Advanced but simple (2-3 stop linear)
  if (isAdvancedGradient(gradient)) {
    const stops = gradient.stops
      .map((stop) => {
        if (stop.position !== undefined) {
          const position = stop.position <= 1 ? `${stop.position * 100}%` : `${stop.position}%`;
          return `${stop.color} ${position}`;
        }
        return stop.color;
      })
      .join(", ");
    return `linear-gradient(${angle}deg, ${stops})`;
  }

  // Fallback (shouldn't reach here)
  return customGradientToCss(gradient);
}

function getBeamDirection(layoutId: string, variant?: string): string {
  const y = 45; // Move beam 10% down from the default 35%

  if (layoutId.startsWith("popup-gradient")) {
    const internalVariant = (variant as "left" | "right" | "center" | undefined) ?? "center";
    const screenshotSide =
      internalVariant === "left" ? "right" : internalVariant === "right" ? "left" : "center";

    const x = screenshotSide === "left" ? 30 : screenshotSide === "right" ? 70 : 50;
    return `circle at ${x}% ${y}%`;
  }

  return `circle at 50% ${y}%`;
}

export function getBackgroundStyle(config: LayoutConfig, assetMap: Map<string, Asset>): string {
  if (config.background?.type === "gradient") {
    const gradient = config.background.customGradient;

    if (gradient) {
      return gradientToCssWithLayout(gradient, config.layoutId, config.variant);
    }
  } else if (config.background?.type === "image") {
    const bgAsset = assetMap.get(config.background.value);
    if (bgAsset) {
      return `url(${bgAsset.url}) center center / cover no-repeat`;
    }
  } else if (config.background?.type === "solid") {
    return tokenToCssColor(config.background.value);
  }

  const bgColor1 = tokenToCssColor(config.colors.background);
  const bgColor2 = tokenToCssColor(config.colors.accent);
  return `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`;
}
