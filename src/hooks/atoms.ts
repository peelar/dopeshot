import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { LayoutConfig, BackgroundConfig, FontId } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { getDefaultDemoPreset } from "@/domain/demo/presets";
import { migrateFontIdToStyle, DEFAULT_FONT_STYLE } from "@/domain/layout/fonts";

// Keep ID here to avoid circular dependencies
export const PLACEHOLDER_ASSET_ID = "placeholder-screenshot";

/**
 * Migrate legacy config with fontId/fontSize to new fontStyle
 */
function migrateLayoutConfig(config: LayoutConfig): LayoutConfig {
  // If config already has fontStyle, return as-is
  if (config.fontStyle) {
    return config;
  }

  // If config has old fontId, migrate it to fontStyle
  if (config.fontId) {
    const fontStyle = migrateFontIdToStyle(config.fontId as FontId);
    const { fontId: _fontId, fontSize: _fontSize, ...rest } = config;
    return {
      ...rest,
      fontStyle,
    } as LayoutConfig;
  }

  // Fallback: add default fontStyle
  return {
    ...config,
    fontStyle: DEFAULT_FONT_STYLE,
  };
}

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

// Base atoms - with migration support for legacy configs
const baseConfigAtom = atom<LayoutConfig>(migrateLayoutConfig(defaultPreset.config));

// Wrap configAtom to ensure migration on reads and writes
// Support both direct values and update functions
export const configAtom = atom(
  (get) => {
    const config = get(baseConfigAtom);
    return migrateLayoutConfig(config);
  },
  (get, set, update: LayoutConfig | ((prev: LayoutConfig) => LayoutConfig)) => {
    const newConfig = typeof update === "function" ? update(get(baseConfigAtom)) : update;
    set(baseConfigAtom, migrateLayoutConfig(newConfig));
  },
);
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

// Brand settings
export interface BrandSettings {
  logoUrl: string | null;
  logoPath: string | null;
  useLogoOnScreenshots: boolean;
}

export const brandSettingsAtom = atomWithStorage<BrandSettings>(
  "dopeshot:brandSettings",
  {
    logoUrl: null,
    logoPath: null,
    useLogoOnScreenshots: false,
  }
);
