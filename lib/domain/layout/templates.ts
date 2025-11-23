import {
  LayoutConfig,
  BackgroundPrimitive,
  TextBlockPrimitive,
  ScreenshotPrimitive,
} from "./types";

export interface Template {
  id: string;
  name: string;
  description: string;
  createConfig: () => LayoutConfig;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const TEMPLATES: Template[] = [
  {
    id: "screenshot-right",
    name: "Screenshot Right",
    description: "Text on the left, large screenshot on the right.",
    createConfig: () => {
      const background: BackgroundPrimitive = {
        id: generateId(),
        type: "background",
        gridColumnStart: 1,
        gridColumnEnd: 13,
        gridRowStart: 1,
        gridRowEnd: 7,
        zIndex: 0,
        variant: "solid",
        colorPrimary: "slate-50",
      };

      const title: TextBlockPrimitive = {
        id: generateId(),
        type: "textBlock",
        role: "title",
        text: "Project Title",
        gridColumnStart: 2,
        gridColumnEnd: 7,
        gridRowStart: 2,
        gridRowEnd: 4,
        zIndex: 10,
        horizontalAlign: "left",
        verticalAlign: "bottom",
        fontId: "inter",
        fontWeightToken: "bold",
        fontSizeToken: "3xl",
      };

      const subtitle: TextBlockPrimitive = {
        id: generateId(),
        type: "textBlock",
        role: "subtitle",
        text: "A brief description goes here.",
        gridColumnStart: 2,
        gridColumnEnd: 7,
        gridRowStart: 4,
        gridRowEnd: 5,
        zIndex: 10,
        horizontalAlign: "left",
        verticalAlign: "top",
        fontId: "inter",
        fontWeightToken: "regular",
        fontSizeToken: "lg",
      };

      const screenshot: ScreenshotPrimitive = {
        id: generateId(),
        type: "screenshot",
        assetId: "", // Placeholder
        gridColumnStart: 7,
        gridColumnEnd: 13,
        gridRowStart: 2,
        gridRowEnd: 6,
        zIndex: 5,
        shadowStyle: "soft",
        borderRadiusPx: 16,
        cropStyle: "full",
      };

      return {
        id: generateId(),
        gridColumns: 12,
        gridRows: 6,
        theme: {
          backgroundColor: "slate-50",
          accentColor: "violet-500",
          textColor: "slate-900",
          mutedTextColor: "slate-500",
          screenshotFrameColor: "slate-200",
          defaultTitleFontId: "inter",
          defaultBodyFontId: "inter",
        },
        primitives: [background, title, subtitle, screenshot],
      };
    },
  },
  {
    id: "screenshot-bottom",
    name: "Screenshot Bottom",
    description: "Centered text at the top, screenshot anchored to bottom.",
    createConfig: () => {
      const background: BackgroundPrimitive = {
        id: generateId(),
        type: "background",
        gridColumnStart: 1,
        gridColumnEnd: 13,
        gridRowStart: 1,
        gridRowEnd: 7,
        zIndex: 0,
        variant: "solid",
        colorPrimary: "indigo-950",
      };

      const title: TextBlockPrimitive = {
        id: generateId(),
        type: "textBlock",
        role: "title",
        text: "Project Title",
        gridColumnStart: 3,
        gridColumnEnd: 11,
        gridRowStart: 1,
        gridRowEnd: 3,
        zIndex: 10,
        horizontalAlign: "center",
        verticalAlign: "middle",
        fontId: "inter",
        fontWeightToken: "bold",
        fontSizeToken: "4xl",
      };

      const screenshot: ScreenshotPrimitive = {
        id: generateId(),
        type: "screenshot",
        assetId: "",
        gridColumnStart: 3,
        gridColumnEnd: 11,
        gridRowStart: 3,
        gridRowEnd: 7,
        zIndex: 5,
        shadowStyle: "hard",
        borderRadiusPx: 8,
        cropStyle: "bottomCut",
      };

      return {
        id: generateId(),
        gridColumns: 12,
        gridRows: 6,
        theme: {
          backgroundColor: "indigo-950",
          accentColor: "indigo-400",
          textColor: "white",
          mutedTextColor: "slate-300",
          screenshotFrameColor: "slate-800",
          defaultTitleFontId: "inter",
          defaultBodyFontId: "inter",
        },
        primitives: [background, title, screenshot],
      };
    },
  },
  {
    id: "minimal-center",
    name: "Minimal Center",
    description: "Just text, clean and simple.",
    createConfig: () => {
      const background: BackgroundPrimitive = {
        id: generateId(),
        type: "background",
        gridColumnStart: 1,
        gridColumnEnd: 13,
        gridRowStart: 1,
        gridRowEnd: 7,
        zIndex: 0,
        variant: "gradientLinear",
        colorPrimary: "slate-50",
        colorSecondary: "slate-200",
      };

      const title: TextBlockPrimitive = {
        id: generateId(),
        type: "textBlock",
        role: "title",
        text: "Focus On Content",
        gridColumnStart: 3,
        gridColumnEnd: 11,
        gridRowStart: 2,
        gridRowEnd: 4,
        zIndex: 10,
        horizontalAlign: "center",
        verticalAlign: "bottom",
        fontId: "inter",
        fontWeightToken: "bold",
        fontSizeToken: "4xl",
      };

      const subtitle: TextBlockPrimitive = {
        id: generateId(),
        type: "textBlock",
        role: "subtitle",
        text: "Less is more.",
        gridColumnStart: 4,
        gridColumnEnd: 10,
        gridRowStart: 4,
        gridRowEnd: 5,
        zIndex: 10,
        horizontalAlign: "center",
        verticalAlign: "top",
        fontId: "inter",
        fontWeightToken: "medium",
        fontSizeToken: "xl",
      };

      return {
        id: generateId(),
        gridColumns: 12,
        gridRows: 6,
        theme: {
          backgroundColor: "slate-50",
          accentColor: "slate-900",
          textColor: "slate-900",
          mutedTextColor: "slate-600",
          screenshotFrameColor: "slate-200",
          defaultTitleFontId: "inter",
          defaultBodyFontId: "inter",
        },
        primitives: [background, title, subtitle],
      };
    },
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
