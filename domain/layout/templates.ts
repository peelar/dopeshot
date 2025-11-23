import { LayoutConfig } from "./types";
import { PopupGradient } from "@/components/templates/PopupGradient";
import type { ComponentType } from "react";
import { Asset } from "@/domain/asset/types";

export interface Template {
  id: string;
  name: string;
  description: string;
  variants: string[]; // Available layout variants for this template
  createConfig: () => LayoutConfig;
  component: ComponentType<{ config: LayoutConfig; assets?: Asset[]; className?: string }>;
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
      text: {
        title: "Project Title",
        subtitle: "A short description.",
      },
      colors: {
        background: "indigo-50",
        text: "slate-900",
        accent: "violet-400",
      },
      assets: {
        screenshot: undefined,
        logo: undefined,
      },
    }),
    component: PopupGradient,
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
