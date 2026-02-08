import { Asset } from "@/domain/asset/types";
import type { Orientation } from "@/hooks/atoms";
import {
  CanvasMode,
  LayoutConfig,
  ScreenshotTreatment,
  TestimonialExportAspect,
  TwitterExportAspect,
} from "./types";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

export const DEFAULT_LOCKED_ASPECT_RATIO = 1280 / 720;
export const DEFAULT_TESTIMONIAL_EXPORT_ASPECT: TestimonialExportAspect = "3:4";
export const DEFAULT_TWITTER_EXPORT_ASPECT: TwitterExportAspect = "4:5";

// Preview dimensions - optimized for UI preview performance and text readability
export const ORIENTATION_DIMENSIONS = {
  desktop: { width: 1280, height: 720 },  // 16:9
  mobile: { width: 720, height: 1280 },   // 9:16
} as const;

// Export dimensions - full resolution for high-quality exports
export const EXPORT_ORIENTATION_DIMENSIONS = {
  desktop: { width: 1920, height: 1080 },  // 16:9
  mobile: { width: 1080, height: 1920 },   // 9:16
} as const;

// Testimonial preview dimensions keep ratios aligned with export sizes.
export const TESTIMONIAL_PREVIEW_DIMENSIONS: Record<TestimonialExportAspect, { width: number; height: number }> = {
  "3:4": { width: 720, height: 960 },
  "4:5": { width: 720, height: 900 },
  "9:16": { width: 720, height: 1280 },
  "16:9": { width: 1280, height: 720 },
};

export const TESTIMONIAL_EXPORT_DIMENSIONS: Record<TestimonialExportAspect, { width: number; height: number }> = {
  "3:4": { width: 1080, height: 1440 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

// Twitter preview dimensions (subset of testimonial ratios)
export const TWITTER_PREVIEW_DIMENSIONS: Record<TwitterExportAspect, { width: number; height: number }> = {
  "4:5": { width: 720, height: 900 },
  "16:9": { width: 1280, height: 720 },
};

export const TWITTER_EXPORT_DIMENSIONS: Record<TwitterExportAspect, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "16:9": { width: 1920, height: 1080 },
};

function isTestimonialExportAspect(
  value: string | undefined,
): value is TestimonialExportAspect {
  return value === "3:4" || value === "4:5" || value === "9:16" || value === "16:9";
}

export function getTestimonialExportAspect(config: LayoutConfig): TestimonialExportAspect {
  const value = config.layoutSpecificSettings?.testimonial?.exportAspect;
  return isTestimonialExportAspect(value) ? value : DEFAULT_TESTIMONIAL_EXPORT_ASPECT;
}

function isTwitterExportAspect(
  value: string | undefined,
): value is TwitterExportAspect {
  return value === "4:5" || value === "16:9";
}

export function getTwitterExportAspect(config: LayoutConfig): TwitterExportAspect {
  const value = config.layoutSpecificSettings?.twitterTestimonial?.exportAspect;
  return isTwitterExportAspect(value) ? value : DEFAULT_TWITTER_EXPORT_ASPECT;
}

function getLockedCanvasDimensions(config: LayoutConfig, orientation: Orientation) {
  const layout = getLayoutDefinition(config.layoutId);
  if (layout?.format === "testimonial") {
    return TESTIMONIAL_PREVIEW_DIMENSIONS[getTestimonialExportAspect(config)];
  }
  if (layout?.format === "tweet") {
    return TWITTER_PREVIEW_DIMENSIONS[getTwitterExportAspect(config)];
  }
  return ORIENTATION_DIMENSIONS[orientation];
}

export function getExportDimensionsForLayout(config: LayoutConfig, orientation: Orientation) {
  const layout = getLayoutDefinition(config.layoutId);
  if (layout?.format === "testimonial") {
    return TESTIMONIAL_EXPORT_DIMENSIONS[getTestimonialExportAspect(config)];
  }
  if (layout?.format === "tweet") {
    return TWITTER_EXPORT_DIMENSIONS[getTwitterExportAspect(config)];
  }
  return EXPORT_ORIENTATION_DIMENSIONS[orientation];
}

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
  const effectiveMode = getEffectiveCanvasMode(config);

  // Normalize orientation to handle legacy values from localStorage
  const normalizedOrientation = (orientation === "mobile" || orientation === "desktop")
    ? orientation
    : "desktop"; // Default to desktop for any invalid/legacy values

  if (effectiveMode === "locked") {
    const dims = getLockedCanvasDimensions(config, normalizedOrientation);
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
  const dims = getLockedCanvasDimensions(config, normalizedOrientation);
  return {
    width: dims.width,
    height: dims.height,
    aspectRatio: dims.width / dims.height,
    mode: effectiveMode,
  };
}
