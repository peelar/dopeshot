export type AspectCategory = "portrait" | "square" | "landscape" | "ultrawide";

const SQUARE_MIN = 0.9;
const SQUARE_MAX = 1.2;
const LANDSCAPE_MAX = 2.2;
const PORTRAIT_MAX = 0.9;

const DEFAULT_RECOMMENDATIONS: Record<AspectCategory, { templateId: string; variant?: string }> = {
  portrait: { templateId: "hero-center", variant: "left" },
  square: { templateId: "adaptive-stage" },
  landscape: { templateId: "popup-gradient", variant: "right" },
  ultrawide: { templateId: "popup-gradient", variant: "right" },
};

export function getAspectCategory(aspectRatio: number): AspectCategory {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return "portrait";
  }

  if (aspectRatio <= PORTRAIT_MAX) {
    return "portrait";
  }

  if (aspectRatio >= SQUARE_MIN && aspectRatio <= SQUARE_MAX) {
    return "square";
  }

  if (aspectRatio <= LANDSCAPE_MAX) {
    return "landscape";
  }

  return "ultrawide";
}

export function getRecommendationForCategory(category: AspectCategory) {
  return DEFAULT_RECOMMENDATIONS[category];
}
