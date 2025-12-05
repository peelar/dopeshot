import { LayoutConfig } from "@/domain/layout/types";
import { PopupGradient } from "@/components/looks/PopupGradient";
import { HeroCenter } from "@/components/looks/HeroCenter";
import type { ComponentType } from "react";
import { DEFAULT_GRADIENT } from "@/domain/layout/gradient-presets";
import { DEFAULT_FONT_ID, DEFAULT_FONT_SIZE } from "@/domain/layout/fonts";
import { AdaptiveScreenshot } from "@/components/looks/AdaptiveScreenshot";

export type LookTextRequirement = "required" | "optional" | "hidden";

export type LookOutlineControls = {
  softGlass: boolean;
  shape: boolean;
  shadow: boolean;
};

export type LookFocusMode = "auto" | "always" | "never";
export type LookCanvasBehavior = "locked" | "adaptive" | "text-dependent";

export interface LookCapabilities {
  focusMode: LookFocusMode;
  canvasBehavior: LookCanvasBehavior;
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

export interface Look {
  id: string;
  name: string;
  description: string;
  variants: string[]; // Available structural variants for this look
  createConfig: () => LayoutConfig;
  component: ComponentType<{
    className?: string;
    onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
    isStatic?: boolean;
  }>;
  capabilities: LookCapabilities;
}

export const LOOKS: Look[] = [
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
    component: PopupGradient,
    capabilities: {
      focusMode: "never",
      canvasBehavior: "locked",
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
    component: HeroCenter,
    capabilities: {
      focusMode: "never",
      canvasBehavior: "locked",
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
      },
    }),
    component: AdaptiveScreenshot,
    capabilities: {
      focusMode: "always",
      canvasBehavior: "adaptive",
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
    },
  },
];

export function getLookById(id: string): Look | undefined {
  if (id === "full-visual") {
    return LOOKS.find((look) => look.id === "adaptive-stage");
  }
  return LOOKS.find((look) => look.id === id);
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

export function withLookTextDefaults(
  config: LayoutConfig,
  options?: LookTextDefaultOptions,
): LayoutConfig {
  const normalizedLookId = config.lookId === "full-visual" ? "adaptive-stage" : config.lookId;
  const look = getLookById(normalizedLookId);
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
