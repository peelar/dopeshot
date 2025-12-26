import type { GradientTemplate } from "./types";
import type { AdvancedGradient } from "@/domain/layout/gradients/types";

/**
 * Create a gradient template with auto-generated label
 */
function createTemplate(
  index: number,
  gradient: AdvancedGradient,
  section: GradientTemplate["section"],
  contrastProfile: GradientTemplate["contrastProfile"],
  lightingMotif?: string,
): GradientTemplate {
  const stopCount = gradient.stops.length;
  const typeLabel = gradient.type;
  const label = [typeLabel, `${stopCount} stops`, contrastProfile, lightingMotif]
    .filter(Boolean)
    .join(" · ");

  return {
    index,
    gradient,
    section,
    label,
    contrastProfile,
    lightingMotif,
    status: "pending",
  };
}

/**
 * Gradient templates organized by section
 */
export const GRADIENT_TEMPLATES: GradientTemplate[] = [
  // ========== Section A: Linear Gradients ==========

  // Two-stop linear gradients
  createTemplate(
    1,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 135,
      colorSpace: "oklch",
    },
    "linear",
    "punchy",
  ),

  createTemplate(
    2,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 90,
      colorSpace: "oklch",
    },
    "linear",
    "punchy",
  ),

  createTemplate(
    3,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 45,
      colorSpace: "oklch",
    },
    "linear",
    "soft",
  ),

  // Three-stop linear gradients
  createTemplate(
    4,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#666666", position: 50 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 135,
      colorSpace: "oklch",
    },
    "linear",
    "medium",
  ),

  createTemplate(
    5,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#333333", position: 70 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 90,
      colorSpace: "oklch",
    },
    "linear",
    "soft",
  ),

  // Diagonal sweeps
  createTemplate(
    6,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 225,
      colorSpace: "oklch",
    },
    "linear",
    "medium",
  ),

  createTemplate(
    7,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 315,
      colorSpace: "oklch",
    },
    "linear",
    "soft",
  ),

  // ========== Section B: Radial Gradients ==========

  // Center bloom
  createTemplate(
    8,
    {
      type: "radial",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#000000", position: 100 },
      ],
      direction: "circle at center",
      colorSpace: "oklch",
    },
    "radial",
    "punchy",
    "center bloom",
  ),

  createTemplate(
    9,
    {
      type: "radial",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#666666", position: 60 },
        { color: "#000000", position: 100 },
      ],
      direction: "circle at center",
      colorSpace: "oklch",
    },
    "radial",
    "soft",
    "center bloom",
  ),

  // Corner glow
  createTemplate(
    10,
    {
      type: "radial",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#000000", position: 100 },
      ],
      direction: "circle at 0% 0%",
      colorSpace: "oklch",
    },
    "radial",
    "medium",
    "corner glow",
  ),

  createTemplate(
    11,
    {
      type: "radial",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#000000", position: 100 },
      ],
      direction: "circle at 100% 0%",
      colorSpace: "oklch",
    },
    "radial",
    "medium",
    "corner glow",
  ),

  // Vignette-style depth
  createTemplate(
    12,
    {
      type: "radial",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#cccccc", position: 40 },
        { color: "#000000", position: 100 },
      ],
      direction: "circle at 50% 50%",
      colorSpace: "oklch",
    },
    "radial",
    "soft",
    "vignette",
  ),

  createTemplate(
    13,
    {
      type: "radial",
      stops: [
        { color: "#ffffff", position: 30 },
        { color: "#000000", position: 100 },
      ],
      direction: "circle at 30% 30%",
      colorSpace: "oklch",
    },
    "radial",
    "medium",
    "offset vignette",
  ),

  // ========== Section C: Conic Gradients ==========

  createTemplate(
    14,
    {
      type: "conic",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 50 },
        { color: "#000000", position: 100 },
      ],
      direction: "from 0deg at center",
      colorSpace: "oklch",
    },
    "conic",
    "soft",
    "subtle wash",
  ),

  createTemplate(
    15,
    {
      type: "conic",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#666666", position: 25 },
        { color: "#000000", position: 50 },
        { color: "#666666", position: 75 },
        { color: "#ffffff", position: 100 },
      ],
      direction: "from 45deg at center",
      colorSpace: "oklch",
    },
    "conic",
    "medium",
    "halo",
  ),

  // ========== Section D: Layered Gradients ==========
  // Note: Layered gradients would require multiple gradient definitions
  // For now, these are conceptual placeholders that would need UI layer composition

  createTemplate(
    16,
    {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 100 },
      ],
      angle: 135,
      colorSpace: "oklch",
    },
    "layered",
    "soft",
    "linear + radial depth",
  ),

  createTemplate(
    17,
    {
      type: "radial",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#000000", position: 100 },
      ],
      direction: "circle at 30% 50%",
      colorSpace: "oklch",
    },
    "layered",
    "medium",
    "multi-layer depth",
  ),

  // ========== Section E: Monochrome / Near-Monochrome ==========

  createTemplate(
    18,
    {
      type: "linear",
      stops: [
        { color: "#0a0a0a", position: 0 },
        { color: "#1a1a1a", position: 100 },
      ],
      angle: 135,
      colorSpace: "oklch",
    },
    "monochrome",
    "soft",
  ),

  createTemplate(
    19,
    {
      type: "linear",
      stops: [
        { color: "#f5f5f5", position: 0 },
        { color: "#e5e5e5", position: 100 },
      ],
      angle: 90,
      colorSpace: "oklch",
    },
    "monochrome",
    "soft",
  ),

  createTemplate(
    20,
    {
      type: "radial",
      stops: [
        { color: "#262626", position: 0 },
        { color: "#0a0a0a", position: 100 },
      ],
      direction: "circle at center",
      colorSpace: "oklch",
    },
    "monochrome",
    "soft",
    "depth-only",
  ),
];

/**
 * Get templates by section
 */
export function getTemplatesBySection(
  section: GradientTemplate["section"],
): GradientTemplate[] {
  return GRADIENT_TEMPLATES.filter((t) => t.section === section);
}

/**
 * Get template by index
 */
export function getTemplateByIndex(index: number): GradientTemplate | undefined {
  return GRADIENT_TEMPLATES.find((t) => t.index === index);
}

/**
 * Section metadata
 */
export const SECTION_METADATA: Record<
  GradientTemplate["section"],
  { title: string; description: string }
> = {
  linear: {
    title: "Linear Gradients",
    description: "Reliability, versatility, brand compatibility",
  },
  radial: {
    title: "Radial Gradients",
    description: "Depth, spotlighting, UI framing",
  },
  conic: {
    title: "Conic Gradients",
    description: "Expressive but fragile structures",
  },
  layered: {
    title: "Layered Gradients",
    description: "Premium feel via compositional depth",
  },
  monochrome: {
    title: "Monochrome / Near-Monochrome",
    description: "Safety, fallback, and UI-first gradients",
  },
};
