import { atom } from "jotai";
import { getTemplateById } from "@/domain/layout/templates";
import {
  getCanvasDimensions,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
import { configAtom, assetsAtom } from "../atoms";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";

// Derived atoms
export const currentTemplateAtom = atom((get) => {
  const config = get(configAtom);
  return getTemplateById(config.templateId);
});

export const templateCapabilitiesAtom = atom((get) => {
  const template = get(currentTemplateAtom);
  return template?.capabilities;
});

export const screenshotAssetAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  return assets.find((asset) => asset.id === config.assets.screenshot);
});

export const canvasAtom = atom((get) => {
  const config = get(configAtom);
  const screenshotAsset = get(screenshotAssetAtom);
  return getCanvasDimensions(config, screenshotAsset);
});

export const screenshotTreatmentAtom = atom((get) => {
  const config = get(configAtom);
  return getScreenshotTreatment(config);
});

export const isScreenshotFocusedModeAtom = atom((get) => {
  const config = get(configAtom);
  return isScreenshotFocused(config);
});

export const shouldShowAspectLockAtom = atom((get) => {
  const templateCapabilities = get(templateCapabilitiesAtom);
  const isScreenshotFocusedMode = get(isScreenshotFocusedModeAtom);
  return templateCapabilities?.canvasBehavior === "text-dependent" && !isScreenshotFocusedMode;
});

export const isAspectLockedAtom = atom((get) => {
  const treatment = get(screenshotTreatmentAtom);
  return treatment.canvasMode === "locked";
});

export const showLayoutToggleAtom = atom((get) => {
  const template = get(currentTemplateAtom);
  return (template?.variants.length ?? 0) > 1;
});

// Asset lookup atoms
export const logoAssetAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  return config.assets.logo ? assets.find((asset) => asset.id === config.assets.logo) : undefined;
});

export const backgroundAssetAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  return config.assets.background
    ? assets.find((asset) => asset.id === config.assets.background)
    : undefined;
});
