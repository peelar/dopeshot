import { LayoutConfig } from "./types";
import { getTemplateById, withTemplateTextDefaults } from "./templates";
import { AspectCategory, getRecommendationForCategory } from "./aspect";

export type TemplateRecommendation = {
  templateId: string;
  variant?: string;
};

export const ASPECT_COPY: Record<AspectCategory, string> = {
  portrait: "portrait",
  square: "square",
  landscape: "landscape",
  ultrawide: "ultra-wide",
};

export function applyTemplateRecommendation(
  config: LayoutConfig,
  recommendation?: TemplateRecommendation,
): {
  config: LayoutConfig;
  changedTemplate: boolean;
  changedVariant: boolean;
  templateName?: string;
} {
  if (!recommendation) {
    return { config, changedTemplate: false, changedVariant: false };
  }

  const template = getTemplateById(recommendation.templateId);
  if (!template) {
    return { config, changedTemplate: false, changedVariant: false };
  }

  const defaultConfig = template.createConfig();
  const variantCandidate =
    recommendation.variant && template.variants.includes(recommendation.variant)
      ? recommendation.variant
      : undefined;

  if (config.templateId !== template.id) {
    const nextConfig = withTemplateTextDefaults({
      ...defaultConfig,
      templateId: template.id,
      variant: variantCandidate || defaultConfig.variant || template.variants[0] || config.variant,
      text: config.text,
      colors: config.colors,
      background: config.background,
      assets: config.assets,
      screenshotShadow: config.screenshotShadow,
      fontId: config.fontId,
      fontSize: config.fontSize,
      screenshotFrame: config.screenshotFrame ?? defaultConfig.screenshotFrame,
    });

    return {
      config: nextConfig,
      changedTemplate: true,
      changedVariant: true,
      templateName: template.name,
    };
  }

  if (variantCandidate && variantCandidate !== config.variant) {
    return {
      config: {
        ...config,
        variant: variantCandidate,
        screenshotFrame: config.screenshotFrame ?? defaultConfig.screenshotFrame,
      },
      changedTemplate: false,
      changedVariant: true,
      templateName: template.name,
    };
  }

  return { config, changedTemplate: false, changedVariant: false };
}

export function getRecommendationForAspectCategory(
  aspectCategory: AspectCategory,
): TemplateRecommendation | undefined {
  return getRecommendationForCategory(aspectCategory);
}
