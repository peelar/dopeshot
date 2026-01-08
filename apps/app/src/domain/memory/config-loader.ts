import type { LayoutConfig, BackgroundConfig } from "@/domain/layout/types";
import type { Orientation } from "@/hooks/atoms";
import type { MemoryConfiguration } from "./types";

/**
 * Hydrate editor state from a MemoryConfiguration
 * Returns all the atom values needed to restore the editor state
 */
export function deserializeEditorState(memory: MemoryConfiguration): {
  config: LayoutConfig;
  screenshotGradient: BackgroundConfig | null;
  orientation: Orientation;
  screenshotZoom: number;
  assets: MemoryConfiguration["assets"];
} {
  // The config already contains the gradient in background
  const screenshotGradient: BackgroundConfig | null =
    memory.config.background.type === "gradient" ? memory.config.background : null;

  return {
    config: memory.config,
    screenshotGradient,
    orientation: memory.orientation,
    screenshotZoom: memory.renderingFlags.screenshotZoom,
    assets: memory.assets ?? [],
  };
}
