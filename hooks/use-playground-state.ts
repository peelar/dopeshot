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

const DEFAULT_ASSETS: Asset[] = [];

export function usePlaygroundState() {
  const [config, setRawConfig] = useState(() =>
    withTemplateTextDefaults(TEMPLATES[0].createConfig()),
  );
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [hasUploaded, setHasUploaded] = useState(false);

  const setConfig = useCallback(
    (next: LayoutConfig | ((current: LayoutConfig) => LayoutConfig)) => {
      setRawConfig((currentConfig) => {
        const computed =
          typeof next === "function"
            ? (next as (c: LayoutConfig) => LayoutConfig)(currentConfig)
            : next;
        return withTemplateTextDefaults(computed);
      });
    },
    [],
  );

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
    hasUploaded,
    setHasUploaded,
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
