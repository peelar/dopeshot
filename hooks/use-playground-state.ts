import { useAtom, useAtomValue } from "jotai";
import { configAtom, assetsAtom } from "./atoms";
import {
  currentTemplateAtom,
  templateCapabilitiesAtom,
  screenshotAssetAtom,
  canvasAtom,
  screenshotTreatmentAtom,
  isScreenshotFocusedModeAtom,
  shouldShowAspectLockAtom,
  isAspectLockedAtom,
  showLayoutToggleAtom,
} from "./atoms/derived";
import type { LayoutConfig } from "@/domain/layout/types";

export function usePlaygroundState() {
  const [config, setConfig] = useAtom(configAtom);
  const [assets, setAssets] = useAtom(assetsAtom);
  const currentTemplate = useAtomValue(currentTemplateAtom);
  const templateCapabilities = useAtomValue(templateCapabilitiesAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const canvas = useAtomValue(canvasAtom);
  const screenshotTreatment = useAtomValue(screenshotTreatmentAtom);
  const isScreenshotFocusedMode = useAtomValue(isScreenshotFocusedModeAtom);
  const shouldShowAspectLock = useAtomValue(shouldShowAspectLockAtom);
  const isAspectLocked = useAtomValue(isAspectLockedAtom);
  const showLayoutToggle = useAtomValue(showLayoutToggleAtom);

  // Wrapper to support functional updates
  const setConfigWithUpdater = (next: LayoutConfig | ((current: LayoutConfig) => LayoutConfig)) => {
    if (typeof next === "function") {
      setConfig((currentConfig) => next(currentConfig));
    } else {
      setConfig(next);
    }
  };

  return {
    config,
    setConfig: setConfigWithUpdater,
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

// Re-export for backward compatibility
export { PLACEHOLDER_ASSET_ID } from "./atoms";
