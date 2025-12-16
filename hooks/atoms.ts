import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { LayoutConfig, BackgroundConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { getDefaultDemoPreset } from "@/domain/demo/presets";

// Keep ID here to avoid circular dependencies
export const PLACEHOLDER_ASSET_ID = "placeholder-screenshot";

// Use deterministic demo preset for SSR - random selection happens client-side
const defaultPreset = getDefaultDemoPreset();

export type AssetType = "screenshot" | "code";

// Orientation types - mobile (9:16) or desktop (16:9)
export type Orientation = "mobile" | "desktop";

/**
 * Default orientation for first load.
 *
 * We intentionally do **not** use device/viewport detection here:
 * the app always starts in desktop (16:9) unless the user changes it.
 */
export const getDefaultOrientation = (): Orientation => {
  return "desktop";
};

// Base atoms
export const configAtom = atom<LayoutConfig>(defaultPreset.config);
export const assetsAtom = atom<Asset[]>([defaultPreset.asset]);
export const statusMessageAtom = atom<string>("");
export const isExportingAtom = atom<boolean>(false);
export const hasCustomScreenshotAtom = atom<boolean>(false);
export const isDraggingAtom = atom<boolean>(false);
export const isAnalyzingColorsAtom = atom<boolean>(false);
export const isProcessingUploadAtom = atom<boolean>(false);
export const screenshotZoomAtom = atom<number>(1.0);

// Store the last screenshot-derived gradient to preserve it across layout switches
export const screenshotGradientAtom = atom<BackgroundConfig | null>(null);

export const assetTypeAtom = atomWithStorage<AssetType>("dopeshot:assetType", "screenshot");

// Orientation atom - initialized with "desktop" (SSR-safe default)
// Updated client-side after mount to avoid hydration mismatches
// This ensures desktop users always start with desktop orientation
export const orientationAtom = atom<Orientation>("desktop");

export const lastLayoutByAssetTypeAtom = atomWithStorage<Record<AssetType, string>>(
  "dopeshot:lastLayoutByAssetType",
  {
    screenshot: "popup-gradient-left", // First layout in rail
    code: "code-snippet",
  },
);
