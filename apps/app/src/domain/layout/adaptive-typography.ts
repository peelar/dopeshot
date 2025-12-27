import type { FontStyle } from "./types";

/**
 * Adaptive Typography System
 *
 * Provides intelligent, responsive typography that automatically scales
 * based on text length, container constraints, and font style characteristics.
 *
 * Each font style has unique scaling behavior:
 * - Founder: Balanced, neutral, max 3 lines
 * - Billboard: Bold, expressive, max 2 lines
 * - Terminal: Compact, technical, max 4 lines
 * - Editorial: Elegant, serif, max 2 lines
 */

export interface TypographyScalingRules {
  /** Minimum font size for titles (rem) */
  titleMinSize: number;
  /** Maximum font size for titles (rem) */
  titleMaxSize: number;
  /** Minimum font size for subtitles (rem) */
  subtitleMinSize: number;
  /** Maximum font size for subtitles (rem) */
  subtitleMaxSize: number;
  /** Line height for titles */
  titleLineHeight: number;
  /** Line height for subtitles */
  subtitleLineHeight: number;
  /** Maximum number of lines for title */
  titleMaxLines: number;
  /** Maximum number of lines for subtitle */
  subtitleMaxLines: number;
  /** Letter spacing for titles (em) */
  titleLetterSpacing?: number;
  /** Letter spacing for subtitles (em) */
  subtitleLetterSpacing?: number;
}

export const FONT_STYLE_SCALING_RULES: Record<FontStyle, TypographyScalingRules> = {
  founder: {
    titleMinSize: 2.25,
    titleMaxSize: 4.5,
    subtitleMinSize: 1.0,
    subtitleMaxSize: 1.375,
    titleLineHeight: 1.1,
    subtitleLineHeight: 1.4,
    titleMaxLines: 3,
    subtitleMaxLines: 3,
  },
  billboard: {
    titleMinSize: 2.25,
    titleMaxSize: 4.5,
    subtitleMinSize: 1.0,
    subtitleMaxSize: 1.5,
    titleLineHeight: 0.95,
    subtitleLineHeight: 1.3,
    titleMaxLines: 2,
    subtitleMaxLines: 2,
    titleLetterSpacing: -0.02,
  },
  terminal: {
    titleMinSize: 2.25,
    titleMaxSize: 4.5,
    subtitleMinSize: 1.0,
    subtitleMaxSize: 1.375,
    titleLineHeight: 1.2,
    subtitleLineHeight: 1.5,
    titleMaxLines: 4,
    subtitleMaxLines: 4,
    titleLetterSpacing: -0.01,
    subtitleLetterSpacing: -0.01,
  },

};

/**
 * Get CSS classes for text container with container query support
 */
export function getTextContainerClasses(fontStyle: FontStyle): string {
  const baseClasses = [
    // Container query support
    "@container/text",
  ];

  return baseClasses.join(" ");
}

/**
 * Get adaptive typography classes for title
 */
export function getTitleClasses(fontStyle: FontStyle, textLength?: number): string {
  const rules = FONT_STYLE_SCALING_RULES[fontStyle];

  const baseClasses = [
    "font-bold",
    "text-balance",
    "overflow-wrap-anywhere",
  ];

  // Add line clamp based on style
  if (rules.titleMaxLines) {
    baseClasses.push(`line-clamp-${rules.titleMaxLines}`);
  }

  // Add style-specific classes
  const styleClasses: Record<FontStyle, string[]> = {
    founder: ["tracking-tight"],
    billboard: ["tracking-tighter", "font-extrabold"],
    terminal: ["tracking-tight", "font-mono"],
  };

  baseClasses.push(...styleClasses[fontStyle]);

  return baseClasses.join(" ");
}

/**
 * Get adaptive typography classes for subtitle
 */
export function getSubtitleClasses(fontStyle: FontStyle, textLength?: number): string {
  const rules = FONT_STYLE_SCALING_RULES[fontStyle];

  const baseClasses = [
    "text-balance",
    "overflow-wrap-anywhere",
    "opacity-90",
  ];

  // Add line clamp based on style
  if (rules.subtitleMaxLines) {
    baseClasses.push(`line-clamp-${rules.subtitleMaxLines}`);
  }

  // Add style-specific classes
  const styleClasses: Record<FontStyle, string[]> = {
    founder: ["tracking-normal"],
    billboard: ["tracking-tight", "font-medium"],
    terminal: ["tracking-tight", "font-mono"],
  };

  baseClasses.push(...styleClasses[fontStyle]);

  return baseClasses.join(" ");
}

/**
 * Calculate adaptive font size based on text length
 * Smoothly scales from max size (short text) to min size (long text)
 */
function calculateAdaptiveFontSize(
  textLength: number,
  minSize: number,
  maxSize: number,
  shortThreshold: number,
  longThreshold: number,
): number {
  if (textLength <= shortThreshold) {
    return maxSize;
  }
  if (textLength >= longThreshold) {
    return minSize;
  }
  
  // Linear interpolation between short and long thresholds
  const progress = (textLength - shortThreshold) / (longThreshold - shortThreshold);
  return maxSize - progress * (maxSize - minSize);
}

/**
 * Get inline styles for title with fluid sizing
 */
export function getTitleStyles(
  fontStyle: FontStyle,
  fontFamily: string,
  textLength?: number,
): React.CSSProperties {
  const rules = FONT_STYLE_SCALING_RULES[fontStyle];
  const length = textLength ?? 0;

  // Calculate adaptive size: short text = larger, long text = smaller
  // Thresholds: 0-40 chars (max size), 40-150 chars (scale), 150+ chars (min size)
  const targetSize = calculateAdaptiveFontSize(
    length,
    rules.titleMinSize,
    rules.titleMaxSize,
    40,
    150,
  );

  return {
    fontFamily,
    fontSize: `${targetSize}rem`,
    lineHeight: rules.titleLineHeight,
    letterSpacing: rules.titleLetterSpacing ? `${rules.titleLetterSpacing}em` : undefined,
  };
}

/**
 * Get inline styles for subtitle with fluid sizing
 */
export function getSubtitleStyles(
  fontStyle: FontStyle,
  fontFamily: string,
  textLength?: number,
): React.CSSProperties {
  const rules = FONT_STYLE_SCALING_RULES[fontStyle];
  const length = textLength ?? 0;

  // Subtitle scales more conservatively than title
  // Thresholds: 0-60 chars (max size), 60-200 chars (scale), 200+ chars (min size)
  const targetSize = calculateAdaptiveFontSize(
    length,
    rules.subtitleMinSize,
    rules.subtitleMaxSize,
    60,
    200,
  );

  return {
    fontFamily,
    fontSize: `${targetSize}rem`,
    lineHeight: rules.subtitleLineHeight,
    letterSpacing: rules.subtitleLetterSpacing ? `${rules.subtitleLetterSpacing}em` : undefined,
  };
}

/**
 * Get complete typography configuration for a font style
 */
export function getAdaptiveTypography(
  fontStyle: FontStyle,
  fontFamily: string,
  titleText?: string,
  subtitleText?: string,
) {
  const titleLength = titleText?.length ?? 0;
  const subtitleLength = subtitleText?.length ?? 0;

  return {
    containerClasses: getTextContainerClasses(fontStyle),
    titleClasses: getTitleClasses(fontStyle, titleLength),
    subtitleClasses: getSubtitleClasses(fontStyle, subtitleLength),
    titleStyle: getTitleStyles(fontStyle, fontFamily, titleLength),
    subtitleStyle: getSubtitleStyles(fontStyle, fontFamily, subtitleLength),
    rules: FONT_STYLE_SCALING_RULES[fontStyle],
  };
}
