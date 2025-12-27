import type { LayoutConfig } from "@/domain/layout/types";
import type { Orientation } from "@/hooks/atoms";
import { DEFAULT_GRADIENT, GRADIENTS } from "@/domain/layout/gradient-presets";
import { DEFAULT_FONT_STYLE } from "@/domain/layout/fonts";

export type LayoutTextRequirement = "required" | "optional" | "hidden";

export type LayoutOutlineControls = {
  softGlass: boolean;
  shadow: boolean;
  fade?: boolean;
  shape?: boolean; // Optional since corners are always rounded now
};

export type LayoutFocusMode = "auto" | "always" | "never";
export type LayoutCanvasBehavior = "locked" | "adaptive" | "text-dependent";
export type LayoutZoomBehavior = "scale-container" | "scale-content";

export interface LayoutCapabilities {
  focusMode: LayoutFocusMode;
  canvasBehavior: LayoutCanvasBehavior;
  zoomBehavior: LayoutZoomBehavior;
  text: {
    headline: LayoutTextRequirement;
    subtitle: LayoutTextRequirement;
  };
  typography: boolean;
  outline: LayoutOutlineControls;
  logo: "supported" | "hidden";
  screenshot: "supported" | "hidden";
  supportedOrientations?: Orientation[];
  copyDefaults?: {
    title?: string;
    subtitle?: string;
  };
}

/**
 * Pure data definition of a Layout (compositional template).
 *
 * Domain layer: Contains no React components or UI dependencies.
 * This allows the domain to be imported by any layer without circular dependencies.
 */
export interface LayoutDefinition {
  id: string;
  name: string;
  description: string;
  variants: string[];
  createConfig: () => LayoutConfig;
  capabilities: LayoutCapabilities;
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Expands a layout definition with multiple variants into separate layout entries.
 * Each variant becomes its own layout with a composite ID and updated name.
 *
 * Example:
 *   Input:  { id: "popup-gradient", name: "Peak", variants: ["left", "right", "center"] }
 *   Output: [
 *     { id: "popup-gradient-left", name: "Peak Left", variants: ["left"], ... },
 *     { id: "popup-gradient-right", name: "Peak Right", variants: ["right"], ... },
 *     { id: "popup-gradient-center", name: "Peak Center", variants: ["center"], ... }
 *   ]
 */
function expandLayoutVariants(layoutDef: LayoutDefinition): LayoutDefinition[] {
  // Layouts with 0 or 1 variant don't need expansion
  if (layoutDef.variants.length <= 1) {
    return [layoutDef];
  }

  // Create a separate layout entry for each variant
  return layoutDef.variants.map((variant) => {
    const baseConfig = layoutDef.createConfig();
    
    // For Peak layout, swap variant names so they reflect where the image peaks from
    // variant "left" means text left/image right (image peaks from right) → display as "Right"
    // variant "right" means text right/image left (image peaks from left) → display as "Left"
    const displayVariant = layoutDef.id === "popup-gradient" && variant !== "center"
      ? (variant === "left" ? "right" : variant === "right" ? "left" : variant)
      : variant;

    return {
      ...layoutDef,
      id: `${layoutDef.id}-${variant}`,
      name: `${layoutDef.name} ${capitalize(displayVariant)}`,
      variants: [variant], // Single variant only
      createConfig: () => ({
        ...baseConfig,
        layoutId: `${layoutDef.id}-${variant}`, // Update layoutId to match new composite ID
        variant, // Bake in the variant (keep internal variant value unchanged)
      }),
    };
  });
}

/**
 * Raw layout definitions with variants array.
 * These will be expanded into individual layout+variant combinations.
 */
const RAW_LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    id: "popup-gradient",
    name: "Peak",
    description: "Gradient hero with headline, subtitle, and an elevated screenshot frame.",
    variants: ["left", "right", "center"],
    createConfig: () => ({
      layoutId: "popup-gradient",
      variant: "right",
      fontStyle: DEFAULT_FONT_STYLE,
      text: {
        title: "",
        subtitle: "",
      },
      colors: {
        background: "indigo-50",
        text: DEFAULT_GRADIENT.textColor,
        accent: "violet-400",
      },
      background: {
        type: "gradient",
        value: DEFAULT_GRADIENT.id,
        gradientSource: "preset",
        grainEnabled: true,
        patternMode: "auto",
      },
      assets: {
        screenshot: undefined,
        logo: undefined,
        background: undefined,
      },
      screenshotShadow: "medium",
       screenshotFrame: {
         preset: "soft-glass",
         canvasMode: "adaptive",
         lockedAspectRatio: 16 / 9,
         shadowEnabled: true,
         shape: "rounded",
       },
    }),
     capabilities: {
       focusMode: "never",
       canvasBehavior: "locked",
       zoomBehavior: "scale-content",
       text: {
         headline: "required",
         subtitle: "optional",
       },
       typography: true,
       outline: {
         softGlass: false,
         shadow: true,
         fade: true,
       },
       logo: "supported",
      screenshot: "supported",
      supportedOrientations: ["mobile", "desktop"],
      copyDefaults: {
        title: "Bring the heat",
        subtitle: "Keep the heat going",
      },
    },
  },
  {
    id: "hero-center",
    name: "Spotlight",
    description: "Split layout with copy on one side and a tall screenshot on the other.",
    variants: ["left", "right"],
    createConfig: () => ({
      layoutId: "hero-center",
      variant: "left",
      fontStyle: DEFAULT_FONT_STYLE,
      text: {
        title: "Bring the heat",
        subtitle: "Keep the heat going",
      },
       colors: {
         background: "slate-50",
         text: "slate-900",
         accent: "violet-400",
       },
       background: {
         type: "gradient",
         value: "cotton-candy",
         gradientSource: "preset",
       },
       assets: {
         screenshot: undefined,
         logo: undefined,
         background: undefined,
       },
       screenshotShadow: "medium",
       screenshotFrame: {
         preset: "soft-glass",
         canvasMode: "locked",
         lockedAspectRatio: 16 / 9,
         shadowEnabled: true,
         shape: "rounded",
       },
     }),
    capabilities: {
      focusMode: "never",
      canvasBehavior: "locked",
      zoomBehavior: "scale-container",
      text: {
        headline: "required",
        subtitle: "optional",
      },
      typography: true,
      outline: {
        softGlass: true,
        shadow: true,
        fade: false,
      },
      logo: "supported",
      screenshot: "supported",
      supportedOrientations: ["desktop"],
      copyDefaults: {
        title: "Bring the heat",
        subtitle: "Keep the heat going",
      },
    },
  },
  {
    id: "adaptive-stage",
    name: "Backdrop",
    description: "Let a single screenshot shine with adaptive sizing and a curated background.",
    variants: [],
    createConfig: () => ({
      layoutId: "adaptive-stage",
      variant: "default",
      fontStyle: DEFAULT_FONT_STYLE,
      text: {
        title: "",
        subtitle: "",
      },
       colors: {
         background: "zinc-50",
         text: "slate-900",
         accent: "violet-400",
       },
       background: {
         type: "gradient",
         value: DEFAULT_GRADIENT.id,
         gradientSource: "preset",
       },
       assets: {
         screenshot: undefined,
         logo: undefined,
         background: undefined,
       },
      screenshotShadow: "medium",
      screenshotFrame: {
        preset: "solid",
        canvasMode: "locked",
        lockedAspectRatio: 16 / 9,
        shadowEnabled: true,
        shape: "rounded",
      },
    }),
    capabilities: {
      focusMode: "always",
      canvasBehavior: "adaptive",
      zoomBehavior: "scale-container",
      text: {
        headline: "hidden",
        subtitle: "hidden",
      },
      typography: false,
      outline: {
        softGlass: true,
        shadow: true,
        fade: false,
      },
      logo: "hidden",
      screenshot: "supported",
      supportedOrientations: ["mobile", "desktop"],
    },
  },
];

/**
 * Exported layout definitions with variants flattened.
 * Each layout+variant combination is its own entry.
 *
 * Total: 6 layouts
 * - popup-gradient-left, popup-gradient-right, popup-gradient-center (Peak)
 * - hero-center-left, hero-center-right (Spotlight)
 * - adaptive-stage (Backdrop, no variants)
 */
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = RAW_LAYOUT_DEFINITIONS.flatMap(expandLayoutVariants);

/**
 * Normalizes legacy layout IDs to their current flattened equivalents.
 * Maps old base IDs (e.g., "popup-gradient") to their default variant
 * (e.g., "popup-gradient-right").
 *
 * @param id - The layout ID to normalize (may be legacy or current)
 * @returns The normalized layout ID
 */
export function normalizeLayoutId(id: string): string {
  // Handle legacy "full-visual" ID
  if (id === "full-visual") {
    return "adaptive-stage";
  }

  // Handle old layout IDs without variant suffix
  // Map old base IDs to their default variant
  const legacyDefaults: Record<string, string> = {
    "popup-gradient": "popup-gradient-right", // Default was "right" in createConfig
    "hero-center": "hero-center-left",        // First variant was "left"
    "adaptive-stage": "adaptive-stage",       // No variants (unchanged)
  };

  return legacyDefaults[id] ?? id;
}

export function getLayoutDefinition(id: string): LayoutDefinition | undefined {
  const normalizedId = normalizeLayoutId(id);
  return LAYOUT_DEFINITIONS.find((layout) => layout.id === normalizedId);
}

/**
 * Check if a layout supports screenshots based on its capabilities
 */
export function supportsScreenshots(layoutId: string): boolean {
  const layoutDef = getLayoutDefinition(layoutId);
  return layoutDef?.capabilities.screenshot === "supported";
}

type LayoutTextDefaultOptions = {
  preserveEmptyText?: boolean;
};

function hasUserProvidedText(value: string | undefined, preserveEmptyText: boolean): boolean {
  if (value === undefined) {
    return false;
  }

  if (value.trim().length > 0) {
    return true;
  }

  return preserveEmptyText;
}

/**
 * Applies default text values to a layout config based on layout capabilities.
 *
 * This is domain logic: it understands layout requirements and config structure,
 * but doesn't depend on UI components.
 */
export function withLayoutTextDefaults(
  config: LayoutConfig,
  options?: LayoutTextDefaultOptions,
): LayoutConfig {
  const normalizedLayoutId = config.layoutId === "full-visual" ? "adaptive-stage" : config.layoutId;
  const layout = getLayoutDefinition(normalizedLayoutId);
  const defaults = layout?.capabilities.copyDefaults;
  if (!layout || !defaults) {
    return config;
  }

  const requirements = layout.capabilities.text;
  const nextText = { ...config.text };
  let shouldUpdate = false;
  const preserveEmptyText = options?.preserveEmptyText ?? false;

  const hasTitle = hasUserProvidedText(nextText.title, preserveEmptyText);
  if (requirements.headline !== "hidden" && !hasTitle && defaults.title) {
    nextText.title = defaults.title;
    shouldUpdate = true;
  }

  const hasSubtitle = hasUserProvidedText(nextText.subtitle, preserveEmptyText);
  if (requirements.subtitle !== "hidden" && !hasSubtitle && defaults.subtitle) {
    nextText.subtitle = defaults.subtitle;
    shouldUpdate = true;
  }

  if (shouldUpdate || normalizedLayoutId !== config.layoutId) {
    return {
      ...config,
      layoutId: normalizedLayoutId,
      text: shouldUpdate ? nextText : config.text,
    };
  }

  return config;
}




