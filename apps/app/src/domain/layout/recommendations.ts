import { LayoutConfig } from "./types";
import { getLayoutDefinition, withLayoutTextDefaults } from "@/domain/layout-def/definitions";
import { AspectCategory, getRecommendationForCategory } from "./aspect";

export type LayoutRecommendation = {
  layoutId: string;
  variant?: string;
};

export const ASPECT_COPY: Record<AspectCategory, string> = {
  portrait: "portrait",
  square: "square",
  landscape: "landscape",
  ultrawide: "ultra-wide",
};

export function applyLayoutRecommendation(
  config: LayoutConfig,
  recommendation?: LayoutRecommendation,
): {
  config: LayoutConfig;
  changedLayout: boolean;
  changedVariant: boolean;
  layoutName?: string;
} {
  if (!recommendation) {
    return { config, changedLayout: false, changedVariant: false };
  }

  const layout = getLayoutDefinition(recommendation.layoutId);
  if (!layout) {
    return { config, changedLayout: false, changedVariant: false };
  }

  const defaultConfig = layout.createConfig();
  const variantCandidate =
    recommendation.variant && layout.variants.includes(recommendation.variant)
      ? recommendation.variant
      : undefined;

  if (config.layoutId !== layout.id) {
    const nextConfig = withLayoutTextDefaults(
      {
        ...defaultConfig,
        layoutId: layout.id,
        variant: variantCandidate || defaultConfig.variant || layout.variants[0] || config.variant,
        text: config.text,
        colors: config.colors,
        background: config.background,
        assets: config.assets,
        screenshotShadow: config.screenshotShadow,
        fontId: config.fontId,
        fontSize: config.fontSize,
        screenshotFrame: config.screenshotFrame ?? defaultConfig.screenshotFrame,
      },
      { preserveEmptyText: true },
    );

    return {
      config: nextConfig,
      changedLayout: true,
      changedVariant: true,
      layoutName: layout.name,
    };
  }

  if (variantCandidate && variantCandidate !== config.variant) {
    return {
      config: {
        ...config,
        variant: variantCandidate,
        screenshotFrame: config.screenshotFrame ?? defaultConfig.screenshotFrame,
      },
      changedLayout: false,
      changedVariant: true,
      layoutName: layout.name,
    };
  }

  return { config, changedLayout: false, changedVariant: false };
}

export function getRecommendationForAspectCategory(
  aspectCategory: AspectCategory,
): LayoutRecommendation | undefined {
  return getRecommendationForCategory(aspectCategory);
}
