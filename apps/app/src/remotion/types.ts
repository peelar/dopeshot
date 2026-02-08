/**
 * Props for the ScreenshotIntro Remotion composition.
 * All values must be serializable (plain strings/numbers).
 */
export type ScreenshotIntroProps = {
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
};
