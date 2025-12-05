import { Asset } from "@/domain/asset/types";
import { CanvasMode, LayoutConfig, ScreenshotTreatment } from "./types";
import { getLookById } from "@/domain/look/looks";

export const DEFAULT_LOCKED_ASPECT_RATIO = 1280 / 720;
const BASE_CANVAS_WIDTH = 1280;

function isBlank(value?: string) {
  return !value || !value.trim();
}

export function isScreenshotFocused(config: LayoutConfig): boolean {
  const look = getLookById(config.lookId);
  const focusMode = look?.capabilities.focusMode ?? "auto";

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
  const look = getLookById(config.lookId);
  const behavior = look?.capabilities.canvasBehavior ?? "locked";

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
): { width: number; height: number; aspectRatio: number; mode: CanvasMode } {
  const treatment = getScreenshotTreatment(config);
  const effectiveMode = getEffectiveCanvasMode(config);
  const lockedAspect = treatment.lockedAspectRatio || DEFAULT_LOCKED_ASPECT_RATIO;
  const screenshotAspect = screenshotAsset?.metadata?.aspectRatio;
  const aspectRatio = effectiveMode === "locked" ? lockedAspect : screenshotAspect || lockedAspect;

  return {
    width: BASE_CANVAS_WIDTH,
    height: Math.round(BASE_CANVAS_WIDTH / aspectRatio),
    aspectRatio,
    mode: effectiveMode,
  };
}
