import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { LayoutConfig, BackgroundConfig, FontId, CustomGradient } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { getLayoutDefinition, type LayoutFormat } from "@/domain/layout-def/definitions";
import { migrateFontIdToStyle } from "@/domain/layout/fonts";
import type { BrandMode, BrandPersonality } from "@/lib/types/brand";

// Keep ID here to avoid circular dependencies
export const PLACEHOLDER_ASSET_ID = "placeholder-screenshot";
export const DEFAULT_EMPTY_LAYOUT_ID = "popup-gradient-left";

export function getEmptyCanvasConfig(): LayoutConfig {
  const layout = getLayoutDefinition(DEFAULT_EMPTY_LAYOUT_ID);
  if (!layout) {
    throw new Error(`Missing layout definition for ${DEFAULT_EMPTY_LAYOUT_ID}`);
  }
  return layout.createConfig();
}

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

  // No fontStyle set - leave undefined so brand personality font can be used
  return config;
}

export type AssetType = "screenshot";

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
export const baseConfigAtom = atom<LayoutConfig>(migrateLayoutConfig(getEmptyCanvasConfig()));

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
export const assetsAtom = atom<Asset[]>([]);
export const statusMessageAtom = atom<string>("");
export const isExportingAtom = atom<boolean>(false);
export const hasCustomScreenshotAtom = atom<boolean>(false);
export const isDraggingAtom = atom<boolean>(false);
export const isAnalyzingColorsAtom = atom<boolean>(false);
export const isProcessingUploadAtom = atom<boolean>(false);
export const screenshotZoomAtom = atom<number>(1.0);

// Store the last screenshot-derived gradient to preserve it across layout switches
export const screenshotGradientAtom = atom<BackgroundConfig | null>(null);
// Store gradient options derived from screenshot analysis
export const gradientOptionsAtom = atom<CustomGradient[]>([]);

export const assetTypeAtom = atomWithStorage<AssetType>("dopeshot:assetType", "screenshot");

// Orientation atom - initialized with "desktop" (SSR-safe default)
// Updated client-side after mount to avoid hydration mismatches
// This ensures desktop users always start with desktop orientation
export const orientationAtom = atom<Orientation>("desktop");

export const lastLayoutByAssetTypeAtom = atomWithStorage<Record<AssetType, string>>(
  "dopeshot:lastLayoutByAssetType",
  {
    screenshot: "popup-gradient-left", // First layout in rail
  },
);

// Brand settings
export interface BrandSettings {
  logoUrl: string | null;
  logoPath: string | null;
  useLogoOnScreenshots: boolean;
  accent: string | null;
  mode: BrandMode | null;
  personality: BrandPersonality | null;
}

export const brandSettingsAtom = atomWithStorage<BrandSettings>(
  "dopeshot:brandSettings",
  {
    logoUrl: null,
    logoPath: null,
    useLogoOnScreenshots: false,
    accent: null,
    mode: null,
    personality: null,
  }
);

// Active format tab in layout selector
// Defaults to "none" — user chooses a format on first visit via the format chooser
export const activeFormatAtom = atom<LayoutFormat>("none");

// Preview mode — image (static) or video (Remotion animation)
export type PreviewMode = "image" | "video";
export const previewModeAtom = atom<PreviewMode>("image");

// Export button state tracking
export const hasExportedAtom = atom<boolean>(false); // True after successful export
export const currentExportBlobAtom = atom<Blob | null>(null); // Store blob after export

// Export success sheet state
export const showExportSheetAtom = atom<boolean>(false); // Show post-export sheet
export const exportThumbnailAtom = atom<string | null>(null); // Thumbnail preview URL

