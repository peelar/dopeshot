import type { ColorPalette, ImageMetadata } from "@/domain/asset/types";
import type { LayoutConfig, PatternChoice, PatternMode } from "./types";

export type LayoutPatternContext = "peek" | "spotlight" | "backdrop" | "code";
export type PatternIntensity = "low" | "medium" | "high";

export type PatternResolution = {
  id: PatternChoice;
  mode: PatternMode;
  intensity: PatternIntensity;
  layoutContext: LayoutPatternContext;
};

export type PatternResolutionContext = {
  palette?: ColorPalette;
  screenshotMetadata?: ImageMetadata;
};

function getLayoutContext(layoutId: string): LayoutPatternContext {
  if (layoutId === "adaptive-stage" || layoutId === "full-visual") return "backdrop";
  if (layoutId.startsWith("hero-center")) return "spotlight";
  if (layoutId === "code-snippet") return "code";
  return "peek";
}

function measureTextDensity(config: LayoutConfig): number {
  const title = config.text?.title ?? "";
  const subtitle = config.text?.subtitle ?? "";
  const words = `${title} ${subtitle}`
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length;
}

function computeIntensity(pattern: PatternChoice, layoutContext: LayoutPatternContext): PatternIntensity {
  if (pattern === "none") return "low";
  if (pattern === "grid") return "low";
  if (layoutContext === "backdrop") return "high";
  if (layoutContext === "peek") return "medium";
  return "low";
}

/**
 * Resolve the pattern to render given config and optional palette context.
 *
 * Inputs considered:
 * - Layout type (Peek, Spotlight, Backdrop, Code) to scale intensity
 * - Content density (headline/subtitle length) to avoid busy overlays on text heavy views
 * - Structured content (code snippets or screenshot metadata) to bias toward Grid
 * - Background type to disable overlays on images and favor grid on solids
 */
export function resolvePatternChoice(
  config: LayoutConfig,
  palette?: ColorPalette,
  context?: PatternResolutionContext,
): PatternResolution {
  const bg = config.background;
  const layoutContext = getLayoutContext(config.layoutId);
  const patternMode: PatternMode =
    bg?.patternMode ?? (bg?.patternId ? "manual" : ("auto" as PatternMode));
  const textDensity = measureTextDensity(config);
  const isTextHeavy = textDensity > 36; // roughly 2-3 full lines of copy
  const hasStructuredContent = Boolean(config.code?.content?.trim()) || Boolean(context?.screenshotMetadata);

  const guardOrganic = (choice?: PatternChoice): PatternChoice => {
    if (!choice) return "grain";

    const normalizedChoice: PatternChoice = choice === "glow" ? "organic" : choice;
    if (normalizedChoice === "organic" && isTextHeavy) return "grain";
    return normalizedChoice;
  };

  const resolveManual = (): PatternChoice => {
    if (bg?.patternId) return guardOrganic(bg.patternId);
    if (bg?.grainEnabled === false) return "none";
    return "grain";
  };

  const resolveAuto = (): PatternChoice => {
    if (bg?.type === "image") return "none";
    if (bg?.grainEnabled === false) return "none";
    if (bg?.type === "solid") return "grid";
    if (layoutContext === "code" || hasStructuredContent) return "grid";
    if (isTextHeavy) return "grain";
    if (layoutContext === "backdrop") return guardOrganic("organic");
    return guardOrganic(palette?.vibrant || palette?.accent ? "organic" : "grain");
  };

  const patternId = patternMode === "manual" ? resolveManual() : resolveAuto();
  return {
    id: patternId,
    mode: patternMode,
    intensity: computeIntensity(patternId, layoutContext),
    layoutContext,
  };
}
