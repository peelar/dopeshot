import type { LayoutConfig } from "@/domain/layout/types";
import { DEFAULT_GRADIENT, GRADIENTS } from "@/domain/layout/gradient-presets";
import { DEFAULT_FONT_ID, DEFAULT_FONT_SIZE } from "@/domain/layout/fonts";

export type LayoutTextRequirement = "required" | "optional" | "hidden";

export type LayoutOutlineControls = {
  softGlass: boolean;
  shape: boolean;
  shadow: boolean;
  fade?: boolean;
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

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    id: "popup-gradient",
    name: "Peak",
    description: "Gradient hero with headline, subtitle, and an elevated screenshot frame.",
    variants: ["left", "right", "center"],
    createConfig: () => ({
      layoutId: "popup-gradient",
      variant: "right",
      fontId: DEFAULT_FONT_ID,
      fontSize: DEFAULT_FONT_SIZE,
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
        canvasMode: "locked",
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
        shape: false,
        shadow: true,
        fade: true,
      },
      logo: "supported",
      screenshot: "supported",
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
      fontId: DEFAULT_FONT_ID,
      fontSize: DEFAULT_FONT_SIZE,
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
        shape: true,
        shadow: true,
      },
      logo: "supported",
      screenshot: "supported",
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
      fontId: DEFAULT_FONT_ID,
      fontSize: DEFAULT_FONT_SIZE,
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
        shape: true,
        shadow: true,
        fade: true,
      },
      logo: "hidden",
      screenshot: "supported",
    },
  },
  {
    id: "code-snippet",
    name: "Code",
    description: "Beautifully formatted code snippet on a gradient background.",
    variants: ["center"],
    createConfig: () => {
      // Use DEFAULT_GRADIENT for consistent SSR hydration
      // Random gradient selection happens client-side via gradient picker
      return {
        layoutId: "code-snippet",
        variant: "center",
        fontId: "developer",
        fontSize: DEFAULT_FONT_SIZE,
        text: {
          title: "",
          subtitle: "",
        },
        colors: {
          background: "slate-900",
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
      code: {
        content: '// Paste your code here\nfunction hello() {\n  console.log("Hello, World!");\n}',
        language: "javascript",
        theme: "github-dark",
      },
      };
    },
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
        shape: true,
        shadow: true,
      },
      logo: "hidden",
      screenshot: "hidden",
    },
  },
];

export function getLayoutDefinition(id: string): LayoutDefinition | undefined {
  // Handle legacy "full-visual" ID
  if (id === "full-visual") {
    return LAYOUT_DEFINITIONS.find((layout) => layout.id === "adaptive-stage");
  }
  return LAYOUT_DEFINITIONS.find((layout) => layout.id === id);
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




