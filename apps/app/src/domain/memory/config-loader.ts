import { isAdvancedGradient } from "@/domain/layout/gradients";
import type { LayoutConfig, BackgroundConfig } from "@/domain/layout/types";
import type { Orientation } from "@/hooks/atoms";
import type { MemoryConfiguration } from "./types";

/**
 * Infer organic-blobs pattern for legacy ambient gradients.
 * Ambient gradients (black→accent or white→accent) should show blob overlays.
 */
function inferLegacyPattern(background: BackgroundConfig): BackgroundConfig | null {
  if (background.patternId) return null;
  if (background.type !== "gradient") return null;

  const gradient = background.customGradient;
  if (!gradient || !isAdvancedGradient(gradient) || gradient.type !== "linear") {
    return null;
  }

  const stopColors = gradient.stops.map((stop) => stop.color?.toLowerCase()).filter(Boolean);
  if (stopColors.length !== 2) return null;

  const hasBlack = stopColors.includes("#000000");
  const hasWhite = stopColors.includes("#ffffff");
  if (!hasBlack && !hasWhite) return null;

  return {
    ...background,
    patternId: "organic-blobs",
    patternMode: "manual",
    patternVariant: hasWhite ? "v2" : "v1",
  };
}

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
  const legacyBackground = inferLegacyPattern(memory.config.background);
  const background = legacyBackground ?? memory.config.background;

  const config: LayoutConfig = legacyBackground
    ? { ...memory.config, background }
    : memory.config;

  // The config already contains the gradient in background
  const screenshotGradient: BackgroundConfig | null =
    background.type === "gradient" ? background : null;

  return {
    config,
    screenshotGradient,
    orientation: memory.orientation,
    screenshotZoom: memory.renderingFlags.screenshotZoom,
    assets: memory.assets ?? [],
  };
}
