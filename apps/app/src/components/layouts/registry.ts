import type { ComponentType } from "react";
import { PopupGradient } from "./PopupGradient";
import { HeroCenter } from "./HeroCenter";
import { AdaptiveScreenshot } from "./AdaptiveScreenshot";
import { Testimonial } from "./Testimonial";

/**
 * Component registry for Layout rendering.
 *
 * UI layer: Maps layout IDs to their React component implementations.
 * Separated from domain definitions to avoid circular dependencies.
 */

export type LayoutComponentProps = {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  isStatic?: boolean;
};

export type LayoutComponent = ComponentType<LayoutComponentProps>;

const LAYOUT_COMPONENTS: Record<string, LayoutComponent> = {
  "popup-gradient": PopupGradient,
  "hero-center": HeroCenter,
  "adaptive-stage": AdaptiveScreenshot,
  "testimonial": Testimonial,
};

export function getLayoutComponent(id: string): LayoutComponent {
  // Try exact match first
  if (LAYOUT_COMPONENTS[id]) {
    return LAYOUT_COMPONENTS[id];
  }

  // Handle legacy "full-visual" ID
  if (id === "full-visual") {
    return LAYOUT_COMPONENTS["adaptive-stage"];
  }

  // Handle flattened layout IDs (e.g., "popup-gradient-left" → "popup-gradient")
  // Extract base ID by removing variant suffix
  const knownVariants = ["left", "right", "center", "centered", "card", "editorial"];
  const lastHyphenIndex = id.lastIndexOf("-");

  if (lastHyphenIndex !== -1) {
    const potentialVariant = id.substring(lastHyphenIndex + 1);
    if (knownVariants.includes(potentialVariant)) {
      const baseId = id.substring(0, lastHyphenIndex);
      const component = LAYOUT_COMPONENTS[baseId];
      if (component) {
        return component;
      }
    }
  }

  // If we get here, no component was found - this is a critical error
  throw new Error(
    `Layout component not found for ID: "${id}". ` +
    `Available IDs: ${Object.keys(LAYOUT_COMPONENTS).join(", ")}. ` +
    `This likely means a layout definition exists but no component is registered for it.`
  );
}
