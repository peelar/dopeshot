import type { ComponentType } from "react";
import { PopupGradient } from "./PopupGradient";
import { HeroCenter } from "./HeroCenter";
import { AdaptiveScreenshot } from "./AdaptiveScreenshot";

/**
 * Component registry for Look rendering.
 * 
 * UI layer: Maps look IDs to their React component implementations.
 * Separated from domain definitions to avoid circular dependencies.
 */

export type LookComponentProps = {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
};

export type LookComponent = ComponentType<LookComponentProps>;

export const LOOK_COMPONENTS: Record<string, LookComponent> = {
  "popup-gradient": PopupGradient,
  "hero-center": HeroCenter,
  "adaptive-stage": AdaptiveScreenshot,
};

export function getLookComponent(id: string): LookComponent | undefined {
  // Handle legacy "full-visual" ID
  if (id === "full-visual") {
    return LOOK_COMPONENTS["adaptive-stage"];
  }
  return LOOK_COMPONENTS[id];
}

