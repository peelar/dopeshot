import { Asset } from "@/domain/asset/types";
import type { Orientation } from "@/hooks/atoms";
import { CanvasMode, LayoutConfig, ScreenshotTreatment } from "./types";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

export const DEFAULT_LOCKED_ASPECT_RATIO = 1280 / 720;
const BASE_CANVAS_WIDTH = 1280;

// Preview dimensions - optimized for UI preview performance and text readability
export const ORIENTATION_DIMENSIONS = {
  desktop: { width: 1280, height: 720 },  // 16:9
  mobile: { width: 720, height: 1080 },   // 2:3
} as const;

// Export dimensions - full resolution for high-quality exports
export const EXPORT_ORIENTATION_DIMENSIONS = {
  desktop: { width: 1920, height: 1080 },  // 16:9
  mobile: { width: 1080, height: 1620 },   // 2:3
} as const;

function isBlank(value?: string) {
  return !value || !value.trim();
}

export function isScreenshotFocused(config: LayoutConfig): boolean {
  const layout = getLayoutDefinition(config.layoutId);
  const focusMode = layout?.capabilities.focusMode ?? "auto";

  if (focusMode === "always") {
    return true;
  }
  if (focusMode === "never") {
    return false;
  }

  return isBlank(config.text?.title) && isBlank(config.text?.subtitle);
}

export function getScreenshotTreatment(config: LayoutConfig): ScreenshotTreatment {
  if (config.screenshotFrame) {
    return config.screenshotFrame;
  }

  return {
    preset: "soft-glass",
    canvasMode: "adaptive",
    lockedAspectRatio: DEFAULT_LOCKED_ASPECT_RATIO,
    shadowEnabled: true,
    shape: "rounded",
  };
}

export function getEffectiveCanvasMode(config: LayoutConfig): CanvasMode {
  const layout = getLayoutDefinition(config.layoutId);
  const behavior = layout?.capabilities.canvasBehavior ?? "locked";

  if (behavior === "locked") {
    return "locked";
  }

  if (behavior === "adaptive") {
    return "adaptive";
  }

  const treatment = getScreenshotTreatment(config);
  return treatment.canvasMode;
}

export function getCanvasDimensions(
  config: LayoutConfig,
  screenshotAsset?: Asset | null,
  orientation: Orientation = "desktop",
): { width: number; height: number; aspectRatio: number; mode: CanvasMode } {
  const layout = getLayoutDefinition(config.layoutId);

  const treatment = getScreenshotTreatment(config);
  const effectiveMode = getEffectiveCanvasMode(config);

  // Normalize orientation to handle legacy values from localStorage
  const normalizedOrientation = (orientation === "mobile" || orientation === "desktop")
    ? orientation
    : "desktop"; // Default to desktop for any invalid/legacy values

  if (effectiveMode === "locked") {
    const dims = ORIENTATION_DIMENSIONS[normalizedOrientation];
    return {
      width: dims.width,
      height: dims.height,
      aspectRatio: dims.width / dims.height,
      mode: effectiveMode,
    };
  }

  // Adaptive mode - use screenshot dimensions
  if (screenshotAsset?.metadata) {
    const { width, height } = screenshotAsset.metadata;
    return {
      width,
      height,
      aspectRatio: width / height,
      mode: effectiveMode,
    };
  }

  // Fallback to orientation defaults
  const dims = ORIENTATION_DIMENSIONS[normalizedOrientation];
  return {
    width: dims.width,
    height: dims.height,
    aspectRatio: dims.width / dims.height,
    mode: effectiveMode,
  };
}
