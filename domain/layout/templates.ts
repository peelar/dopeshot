import { LayoutConfig } from "./types";
import { PopupGradient } from "@/components/templates/PopupGradient";
import type { ComponentType } from "react";
import { Asset } from "@/domain/asset/types";
import { DEFAULT_GRADIENT } from "@/domain/layout/gradients";
import { DEFAULT_FONT_ID, DEFAULT_FONT_SIZE } from "@/domain/layout/fonts";

export interface Template {
  id: string;
  name: string;
  description: string;
  variants: string[]; // Available layout variants for this template
  createConfig: () => LayoutConfig;
  component: ComponentType<{
    config: LayoutConfig;
    assets?: Asset[];
    className?: string;
    onTextChange?: (field: "title" | "subtitle", value: string) => void;
  }>;
}

export const TEMPLATES: Template[] = [
  {
    id: "popup-gradient",
    name: "Popup & Gradient",
    description: "Gradient background with a logo and a pop-up screenshot.",
    variants: ["left", "right", "center"],
    createConfig: () => ({
      templateId: "popup-gradient",
      variant: "right",
      fontId: DEFAULT_FONT_ID,
      fontSize: DEFAULT_FONT_SIZE,
      text: {
        title: "Change me",
        subtitle: "Drop some vibes and tell the story.",
      },
      colors: {
        background: "indigo-50",
        text: DEFAULT_GRADIENT.textColor,
        accent: "violet-400",
      },
      background: {
        type: "gradient",
        value: DEFAULT_GRADIENT.id,
      },
      assets: {
        screenshot: undefined,
        logo: undefined,
        background: undefined,
      },
    }),
    component: PopupGradient,
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
