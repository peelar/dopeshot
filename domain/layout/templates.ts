import { LayoutConfig } from "./types";
import { PopupGradient } from "@/components/templates/PopupGradient";
import { HeroCenter } from "@/components/templates/HeroCenter";
import type { ComponentType } from "react";
import { Asset } from "@/domain/asset/types";
import { DEFAULT_GRADIENT } from "@/domain/layout/gradient-presets";
import { DEFAULT_FONT_ID, DEFAULT_FONT_SIZE } from "@/domain/layout/fonts";
import { AdaptiveScreenshot } from "@/components/templates/AdaptiveScreenshot";

export type TemplateTextRequirement = "required" | "optional" | "hidden";

export type TemplateOutlineControls = {
  softGlass: boolean;
  shape: boolean;
  shadow: boolean;
};

export type TemplateFocusMode = "auto" | "always" | "never";
export type TemplateCanvasBehavior = "locked" | "adaptive" | "text-dependent";

export interface TemplateCapabilities {
  focusMode: TemplateFocusMode;
  canvasBehavior: TemplateCanvasBehavior;
  text: {
    headline: TemplateTextRequirement;
    subtitle: TemplateTextRequirement;
  };
  typography: boolean;
  outline: TemplateOutlineControls;
  logo: "supported" | "hidden";
  copyDefaults?: {
    title?: string;
    subtitle?: string;
  };
}

export interface Template {
  id: string;
  name: string;
  description: string;
  variants: string[]; // Available layout variants for this template
  createConfig: () => LayoutConfig;
  component: ComponentType<{
    className?: string;
    onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
    isStatic?: boolean;
  }>;
  capabilities: TemplateCapabilities;
}

export const TEMPLATES: Template[] = [
  {
    id: "popup-gradient",
    name: "Peak",
    description: "Gradient hero with headline, subtitle, and an elevated screenshot frame.",
    variants: ["left", "right", "center"],
    createConfig: () => ({
      templateId: "popup-gradient",
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
      templateId: "hero-center",
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
      templateId: "adaptive-stage",
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

export function getTemplateById(id: string): Template | undefined {
  if (id === "full-visual") {
    return TEMPLATES.find((t) => t.id === "adaptive-stage");
  }
  return TEMPLATES.find((t) => t.id === id);
}

type TemplateTextDefaultOptions = {
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

export function withTemplateTextDefaults(
  config: LayoutConfig,
  options?: TemplateTextDefaultOptions,
): LayoutConfig {
  const normalizedTemplateId = config.templateId === "full-visual" ? "adaptive-stage" : config.templateId;
  const template = getTemplateById(normalizedTemplateId);
  const defaults = template?.capabilities.copyDefaults;
  if (!template || !defaults) {
    return config;
  }

  const requirements = template.capabilities.text;
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

  if (shouldUpdate || normalizedTemplateId !== config.templateId) {
    return {
      ...config,
      templateId: normalizedTemplateId,
      text: shouldUpdate ? nextText : config.text,
    };
  }

  return config;
}
