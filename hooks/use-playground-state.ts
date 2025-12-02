import { useState, useCallback, useMemo } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { TEMPLATES, withTemplateTextDefaults } from "@/domain/layout/templates";
import { getTemplateById } from "@/domain/layout/templates";
import {
  getCanvasDimensions,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
export const PLACEHOLDER_ASSET_ID = "placeholder-screenshot";

const PLACEHOLDER_ASSET: Asset = {
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

function createInitialConfig() {
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

export function usePlaygroundState() {
  const [config, setRawConfig] = useState(() => createInitialConfig());
  const [assets, setAssets] = useState<Asset[]>(() => [PLACEHOLDER_ASSET]);

  const setConfig = useCallback((next: LayoutConfig | ((current: LayoutConfig) => LayoutConfig)) => {
    setRawConfig((currentConfig) => {
      const computed =
        typeof next === "function" ? (next as (c: LayoutConfig) => LayoutConfig)(currentConfig) : next;
      return computed;
    });
  }, []);

  const currentTemplate = useMemo(() => getTemplateById(config.templateId), [config.templateId]);
  const templateCapabilities = currentTemplate?.capabilities;
  const screenshotAsset = useMemo(
    () => assets.find((asset) => asset.id === config.assets.screenshot),
    [assets, config.assets.screenshot],
  );
  const canvas = useMemo(
    () => getCanvasDimensions(config, screenshotAsset),
    [config, screenshotAsset],
  );
  const screenshotTreatment = useMemo(() => getScreenshotTreatment(config), [config]);
  const isScreenshotFocusedMode = useMemo(() => isScreenshotFocused(config), [config]);
  const shouldShowAspectLock =
    templateCapabilities?.canvasBehavior === "text-dependent" && !isScreenshotFocusedMode;
  const isAspectLocked = screenshotTreatment.canvasMode === "locked";
  const showLayoutToggle = (currentTemplate?.variants.length ?? 0) > 1;

  return {
    config,
    setConfig,
    assets,
    setAssets,
    currentTemplate,
    templateCapabilities,
    screenshotAsset,
    canvas,
    screenshotTreatment,
    isScreenshotFocusedMode,
    shouldShowAspectLock,
    isAspectLocked,
    showLayoutToggle,
  };
}

