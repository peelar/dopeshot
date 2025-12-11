import { Asset } from "@/domain/asset/types";
import { CanvasMode, LayoutConfig, ScreenshotTreatment } from "./types";
import { getLookDefinition } from "@/domain/look/definitions";

export const DEFAULT_LOCKED_ASPECT_RATIO = 1280 / 720;
const BASE_CANVAS_WIDTH = 1280;

function isBlank(value?: string) {
  return !value || !value.trim();
}

export function isScreenshotFocused(config: LayoutConfig): boolean {
  const look = getLookDefinition(config.lookId);
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
  const look = getLookDefinition(config.lookId);
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
  const look = getLookDefinition(config.lookId);

  // Code snippet look uses content-based sizing, not fixed canvas
  if (config.lookId === "code-snippet") {
    // Return a flexible aspect ratio that will be overridden by content
    // The actual size will be determined by the code content + padding
    return {
      width: BASE_CANVAS_WIDTH,
      height: 720,
      aspectRatio: 16 / 9,
      mode: "adaptive",
    };
  }

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
