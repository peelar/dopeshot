import type { ComponentType } from "react";
import { PopupGradient } from "./PopupGradient";
import { HeroCenter } from "./HeroCenter";
import { AdaptiveScreenshot } from "./AdaptiveScreenshot";
import { CodeSnippet } from "./CodeSnippet";

/**
 * Component registry for Layout rendering.
 *
 * UI layer: Maps layout IDs to their React component implementations.
 * Separated from domain definitions to avoid circular dependencies.
 */

export type LayoutComponentProps = {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
};

export type LayoutComponent = ComponentType<LayoutComponentProps>;

const LAYOUT_COMPONENTS: Record<string, LayoutComponent> = {
  "popup-gradient": PopupGradient,
  "hero-center": HeroCenter,
  "adaptive-stage": AdaptiveScreenshot,
  "code-snippet": CodeSnippet,
};

export function getLayoutComponent(id: string): LayoutComponent | undefined {
  // Handle legacy "full-visual" ID
  if (id === "full-visual") {
    return LAYOUT_COMPONENTS["adaptive-stage"];
  }
  return LAYOUT_COMPONENTS[id];
}
