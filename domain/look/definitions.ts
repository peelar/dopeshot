import type { LayoutConfig } from "@/domain/layout/types";
import { DEFAULT_GRADIENT } from "@/domain/layout/gradient-presets";
import { DEFAULT_FONT_ID, DEFAULT_FONT_SIZE } from "@/domain/layout/fonts";

export type LookTextRequirement = "required" | "optional" | "hidden";

export type LookOutlineControls = {
  softGlass: boolean;
  shape: boolean;
  shadow: boolean;
  fade?: boolean;
};

export type LookFocusMode = "auto" | "always" | "never";
export type LookCanvasBehavior = "locked" | "adaptive" | "text-dependent";
export type LookZoomBehavior = "scale-container" | "scale-content";

export interface LookCapabilities {
  focusMode: LookFocusMode;
  canvasBehavior: LookCanvasBehavior;
  zoomBehavior: LookZoomBehavior;
  text: {
    headline: LookTextRequirement;
    subtitle: LookTextRequirement;
  };
  typography: boolean;
  outline: LookOutlineControls;
  logo: "supported" | "hidden";
  copyDefaults?: {
    title?: string;
    subtitle?: string;
  };
}

/**
 * Pure data definition of a Look (visual style/template).
 * 
 * Domain layer: Contains no React components or UI dependencies.
 * This allows the domain to be imported by any layer without circular dependencies.
 */
export interface LookDefinition {
  id: string;
  name: string;
  description: string;
  variants: string[];
  createConfig: () => LayoutConfig;
  capabilities: LookCapabilities;
}

export const LOOK_DEFINITIONS: LookDefinition[] = [
  {
    id: "popup-gradient",
    name: "Peak",
    description: "Gradient hero with headline, subtitle, and an elevated screenshot frame.",
    variants: ["left", "right", "center"],
    createConfig: () => ({
      lookId: "popup-gradient",
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
      },
      logo: "supported",
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
      lookId: "hero-center",
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
      lookId: "adaptive-stage",
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
        fadeEnabled: true,
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
    },
  },
];

export function getLookDefinition(id: string): LookDefinition | undefined {
  // Handle legacy "full-visual" ID
  if (id === "full-visual") {
    return LOOK_DEFINITIONS.find((look) => look.id === "adaptive-stage");
  }
  return LOOK_DEFINITIONS.find((look) => look.id === id);
}

type LookTextDefaultOptions = {
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
 * Applies default text values to a layout config based on look capabilities.
 * 
 * This is domain logic: it understands look requirements and config structure,
 * but doesn't depend on UI components.
 */
export function withLookTextDefaults(
  config: LayoutConfig,
  options?: LookTextDefaultOptions,
): LayoutConfig {
  const normalizedLookId = config.lookId === "full-visual" ? "adaptive-stage" : config.lookId;
  const look = getLookDefinition(normalizedLookId);
  const defaults = look?.capabilities.copyDefaults;
  if (!look || !defaults) {
    return config;
  }

  const requirements = look.capabilities.text;
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

  if (shouldUpdate || normalizedLookId !== config.lookId) {
    return {
      ...config,
      lookId: normalizedLookId,
      text: shouldUpdate ? nextText : config.text,
    };
  }

  return config;
}


