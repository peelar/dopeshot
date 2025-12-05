import { LayoutConfig } from "./types";
import { getLookById, withLookTextDefaults } from "@/domain/look/looks";
import { AspectCategory, getRecommendationForCategory } from "./aspect";

export type LookRecommendation = {
  lookId: string;
  variant?: string;
};

export const ASPECT_COPY: Record<AspectCategory, string> = {
  portrait: "portrait",
  square: "square",
  landscape: "landscape",
  ultrawide: "ultra-wide",
};

export function applyLookRecommendation(
  config: LayoutConfig,
  recommendation?: LookRecommendation,
): {
  config: LayoutConfig;
  changedLook: boolean;
  changedVariant: boolean;
  lookName?: string;
} {
  if (!recommendation) {
    return { config, changedLook: false, changedVariant: false };
  }

  const look = getLookById(recommendation.lookId);
  if (!look) {
    return { config, changedLook: false, changedVariant: false };
  }

  const defaultConfig = look.createConfig();
  const variantCandidate =
    recommendation.variant && look.variants.includes(recommendation.variant)
      ? recommendation.variant
      : undefined;

  if (config.lookId !== look.id) {
    const nextConfig = withLookTextDefaults(
      {
        ...defaultConfig,
        lookId: look.id,
        variant:
          variantCandidate || defaultConfig.variant || look.variants[0] || config.variant,
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
      changedLook: true,
      changedVariant: true,
      lookName: look.name,
    };
  }

  if (variantCandidate && variantCandidate !== config.variant) {
    return {
      config: {
        ...config,
        variant: variantCandidate,
        screenshotFrame: config.screenshotFrame ?? defaultConfig.screenshotFrame,
      },
      changedLook: false,
      changedVariant: true,
      lookName: look.name,
    };
  }

  return { config, changedLook: false, changedVariant: false };
}

export function getRecommendationForAspectCategory(
  aspectCategory: AspectCategory,
): LookRecommendation | undefined {
  return getRecommendationForCategory(aspectCategory);
}
