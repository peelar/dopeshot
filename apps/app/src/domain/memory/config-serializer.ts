import type { LayoutConfig, BackgroundConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import type { Orientation } from "@/hooks/atoms";
import type { MemoryConfiguration } from "./types";

/**
 * Serialize the current editor state into a MemoryConfiguration
 * This captures everything needed to restore the exact state later
 */
export function serializeEditorState(params: {
  config: LayoutConfig;
  assets: Asset[];
  screenshotGradient: BackgroundConfig | null;
  orientation: Orientation;
  screenshotZoom: number;
  screenshotPath: string;
}): MemoryConfiguration {
  const { config, screenshotGradient, orientation, screenshotZoom, screenshotPath } = params;

  // Create a deep copy of the config to avoid mutations
  const configCopy: LayoutConfig = JSON.parse(JSON.stringify(config));

  // If there's a screenshot gradient, override the background
  if (screenshotGradient) {
    configCopy.background = screenshotGradient;
  }

  return {
    version: 1,
    layoutId: config.layoutId,
    variant: config.variant,
    orientation,
    screenshotPath,
    config: configCopy,
    renderingFlags: {
      aspectLocked: config.screenshotFrame?.canvasMode === "locked",
      screenshotZoom,
    },
  };
}
