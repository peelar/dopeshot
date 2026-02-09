/**
 * Serializable text style for the video composition.
 * Mirrors the inline styles from adaptive typography, pre-computed in pixels.
 */
export type VideoTextStyle = {
  /** Font size in pixels (already scaled for export dimensions) */
  fontSizePx: number;
  /** Unitless line-height multiplier */
  lineHeight: number;
  /** Letter spacing in em, or 0 if none */
  letterSpacingEm: number;
  /** CSS font-weight */
  fontWeight: number;
};

/**
 * Props for the PeakVideo Remotion composition.
 * All values must be serializable (plain strings/numbers).
 */
export type PeakVideoProps = {
  /** Data URL or remote URL of the uploaded screenshot */
  screenshotUrl: string;
  /** Headline text */
  title: string;
  /** Subtitle text */
  subtitle: string;
  /** CSS background value (gradient string or solid color) */
  backgroundCss: string;
  /** CSS font-family value, e.g. "var(--font-clean)" */
  fontFamily: string;
  /** CSS color for text, e.g. "rgb(248 250 252)" */
  textColor: string;
  /** Peak layout variant — determines screenshot entrance direction */
  variant: "left" | "right" | "center";
  /** CSS box-shadow value for the screenshot frame */
  screenshotShadowCss: string;
  /** Pre-computed title text style (pixel sizes at export resolution) */
  titleStyle?: VideoTextStyle;
  /** Pre-computed subtitle text style (pixel sizes at export resolution) */
  subtitleStyle?: VideoTextStyle;
  /** Whether to show grain overlay */
  grainEnabled?: boolean;
  /** Whether the screenshot fade effect is enabled */
  fadeEnabled?: boolean;
  /** Whether the typing animation is enabled for text */
  typingEnabled?: boolean;
};
