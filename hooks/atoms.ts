import { atom } from "jotai";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { TEMPLATES, withTemplateTextDefaults } from "@/domain/layout/templates";
import { getTemplateById } from "@/domain/layout/templates";

export const PLACEHOLDER_ASSET_ID = "placeholder-screenshot";

export const PLACEHOLDER_ASSET: Asset = {
  id: PLACEHOLDER_ASSET_ID,
  projectId: "demo",
  userId: "demo-user",
  name: "Placeholder screenshot",
  url: "/demo.png",
  kind: "screenshot",
  createdAt: "2024-01-01T00:00:00.000Z",
  metadata: {
    width: 3060,
    height: 1896,
    aspectRatio: 3060 / 1896,
    orientation: "landscape",
  },
};

function createInitialConfig(): LayoutConfig {
  const peakTemplate = getTemplateById("popup-gradient") ?? TEMPLATES[0];
  const templateConfig = peakTemplate.createConfig();
  return withTemplateTextDefaults({
    ...templateConfig,
    templateId: "popup-gradient",
    variant: "center",
    text: {
      ...templateConfig.text,
      title: "Bring the heat",
      subtitle: "Drop some vibes and tell the story",
    },
    colors: {
      ...templateConfig.colors,
      background: "slate-900",
      text: "slate-50",
      accent: "violet-400",
    },
    background: {
      type: "gradient",
      value: "custom",
      grainEnabled: true,
      customGradient: {
        type: "linear",
        angle: 130,
        colorSpace: "oklch",
        stops: [
          { color: "#0f172a", position: 0 },
          { color: "#312e81", position: 45 },
          { color: "#c026d3", position: 100 },
        ],
      },
    },
    assets: {
      ...templateConfig.assets,
      screenshot: PLACEHOLDER_ASSET_ID,
    },
  });
}

// Base atoms
export const configAtom = atom<LayoutConfig>(createInitialConfig());
export const assetsAtom = atom<Asset[]>([PLACEHOLDER_ASSET]);
export const statusMessageAtom = atom<string>("");
export const isExportingAtom = atom<boolean>(false);
export const hasCustomScreenshotAtom = atom<boolean>(false);
export const isDraggingAtom = atom<boolean>(false);
export const isAnalyzingColorsAtom = atom<boolean>(false);
export const isProcessingUploadAtom = atom<boolean>(false);
