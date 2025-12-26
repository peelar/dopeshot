import type { AdvancedGradient } from "@/domain/layout/gradients/types";

/**
 * Gradient template section categories
 */
export type GradientSection =
  | "linear"
  | "radial"
  | "conic"
  | "layered"
  | "monochrome";

/**
 * Rejection reasons for gradient templates
 */
export type RejectionReason =
  | "too-muddy"
  | "banding-risk"
  | "over-accented"
  | "hue-clash"
  | "poor-legibility"
  | "distracting"
  | "feels-dated"
  | "too-specific";

/**
 * Curation status for a gradient template
 */
export type CurationStatus = "pending" | "keep" | "reject";

/**
 * Gradient template with curation metadata
 */
export interface GradientTemplate {
  /** Unique index number (e.g., 1 → #001) */
  index: number;
  /** Gradient definition */
  gradient: AdvancedGradient;
  /** Section this gradient belongs to */
  section: GradientSection;
  /** Structural label (e.g., "linear · 3 stops · soft · center glow") */
  label: string;
  /** Contrast profile */
  contrastProfile: "soft" | "medium" | "punchy";
  /** Optional lighting motif */
  lightingMotif?: string;
  /** Curation status */
  status: CurationStatus;
  /** Rejection reasons (if status is "reject") */
  rejectionReasons?: RejectionReason[];
  /** Free-form notes */
  notes?: string;
}

/**
 * Test palette for gradient evaluation
 */
export interface TestPalette {
  id: string;
  name: string;
  colors: {
    /** Primary/dominant color */
    primary: string;
    /** Secondary/accent color */
    secondary: string;
    /** Optional tertiary accent */
    tertiary?: string;
    /** Base/neutral color */
    neutral: string;
  };
}
