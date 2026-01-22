import { atom } from "jotai";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";
import {
  getCanvasDimensions,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
import { configAtom, assetsAtom, orientationAtom, brandSettingsAtom } from "../atoms";
import {
  getStyleForPersonality,
  type PersonalityStyle,
} from "@/domain/brand/personality-mapping";

// Derived atoms
export const currentLayoutAtom = atom((get) => {
  const config = get(configAtom);
  return getLayoutDefinition(config.layoutId);
});

export const layoutCapabilitiesAtom = atom((get) => {
  const layout = get(currentLayoutAtom);
  return layout?.capabilities;
});

export const screenshotAssetAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  return assets.find((asset) => asset.id === config.assets.screenshot);
});

export const canvasAtom = atom((get) => {
  const config = get(configAtom);
  const screenshotAsset = get(screenshotAssetAtom);
  const orientation = get(orientationAtom);
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
  const layoutCapabilities = get(layoutCapabilitiesAtom);
  const isScreenshotFocusedMode = get(isScreenshotFocusedModeAtom);
  return layoutCapabilities?.canvasBehavior === "text-dependent" && !isScreenshotFocusedMode;
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

// Brand logo asset from brand settings
export const brandLogoAssetAtom = atom((get) => {
  const brandSettings = get(brandSettingsAtom);
  const assets = get(assetsAtom);

  // Find the brand logo in assets by matching the URL
  if (brandSettings.logoUrl) {
    return assets.find((asset) =>
      asset.kind === "logo" && asset.url === brandSettings.logoUrl
    );
  }

  return undefined;
});

/**
 * Derived atom that computes the personality style tokens from brand settings.
 * Returns null if no personality is set, otherwise returns the full PersonalityStyle
 * object containing cornerRadius, shadow, texture, and fontStyle.
 */
export const personalityStyleAtom = atom<PersonalityStyle | null>((get) => {
  const brandSettings = get(brandSettingsAtom);
  return getStyleForPersonality(brandSettings.personality);
});
