import { atom } from "jotai";
import { getLookDefinition } from "@/domain/look/definitions";
import {
  getCanvasDimensions,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
import { configAtom, assetsAtom, canvasOrientationAtom } from "../atoms";

// Derived atoms
export const currentLookAtom = atom((get) => {
  const config = get(configAtom);
  return getLookDefinition(config.lookId);
});

export const lookCapabilitiesAtom = atom((get) => {
  const look = get(currentLookAtom);
  return look?.capabilities;
});

export const screenshotAssetAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  return assets.find((asset) => asset.id === config.assets.screenshot);
});

export const canvasAtom = atom((get) => {
  const config = get(configAtom);
  const screenshotAsset = get(screenshotAssetAtom);
  const orientation = get(canvasOrientationAtom);
  return getCanvasDimensions(config, screenshotAsset, orientation);
});

const screenshotTreatmentAtom = atom((get) => {
  const config = get(configAtom);
  return getScreenshotTreatment(config);
});

export const isScreenshotFocusedModeAtom = atom((get) => {
  const config = get(configAtom);
  return isScreenshotFocused(config);
});

export const shouldShowAspectLockAtom = atom((get) => {
  const lookCapabilities = get(lookCapabilitiesAtom);
  const isScreenshotFocusedMode = get(isScreenshotFocusedModeAtom);
  return lookCapabilities?.canvasBehavior === "text-dependent" && !isScreenshotFocusedMode;
});

export const isAspectLockedAtom = atom((get) => {
  const treatment = get(screenshotTreatmentAtom);
  return treatment.canvasMode === "locked";
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
