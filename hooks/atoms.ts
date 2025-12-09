import { atom } from "jotai";
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { getDefaultDemoPreset } from "@/domain/demo/presets";

// Keep ID here to avoid circular dependencies
export const PLACEHOLDER_ASSET_ID = "placeholder-screenshot";

// Use deterministic demo preset for SSR - random selection happens client-side
const defaultPreset = getDefaultDemoPreset();

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

