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
  const { config, assets, screenshotGradient, orientation, screenshotZoom, screenshotPath } = params;

  // Create a deep copy of the config to avoid mutations
  const configCopy: LayoutConfig = JSON.parse(JSON.stringify(config));

  // If there's a screenshot gradient, merge to avoid dropping pattern metadata
  if (screenshotGradient) {
    const currentBackground = configCopy.background;
    configCopy.background = {
      ...currentBackground,
      ...screenshotGradient,
      patternId: screenshotGradient.patternId ?? currentBackground?.patternId,
      patternMode: screenshotGradient.patternMode ?? currentBackground?.patternMode,
      patternVariant: screenshotGradient.patternVariant ?? currentBackground?.patternVariant,
    };
  }

  const referencedAssetIds = new Set(
    Object.values(config.assets).filter((value): value is string => Boolean(value))
  );

  // Testimonial avatars are stored in layout-specific settings, not config.assets.
  const testimonialAvatarAssetId = config.layoutSpecificSettings?.testimonial?.authorAvatarAssetId;
  if (testimonialAvatarAssetId) {
    referencedAssetIds.add(testimonialAvatarAssetId);
  }
  const serializedAssets = referencedAssetIds.size
    ? assets.filter((asset) => referencedAssetIds.has(asset.id))
    : [];

  return {
    version: 1,
    layoutId: config.layoutId,
    variant: config.variant,
    orientation,
    screenshotPath,
    config: configCopy,
    assets: serializedAssets,
    renderingFlags: {
      aspectLocked: config.screenshotFrame?.canvasMode === "locked",
      screenshotZoom,
    },
  };
}
