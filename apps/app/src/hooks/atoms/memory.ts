import { atom } from "jotai";
import type { MemoryItemDTO, MemoryConfiguration } from "@/domain/memory/types";
import { SAVE_LIMIT } from "@/domain/memory/constants";
import {
  configAtom,
  assetsAtom,
  screenshotGradientAtom,
  orientationAtom,
  screenshotZoomAtom,
} from "@/hooks/atoms";
import { serializeEditorState } from "@/domain/memory/config-serializer";
import { computeConfigHash } from "@/domain/memory/config-hash";

/**
 * Memory sidebar visibility
 */
export const memorySidebarOpenAtom = atom(false);

/**
 * Cached memory items fetched from server
 */
export const memoryItemsAtom = atom<MemoryItemDTO[]>([]);

/**
 * Loading state for fetching memory items list
 */
export const memoryItemsLoadingAtom = atom(false);

/**
 * Loading state for loading a specific memory item
 */
export const memoryLoadingAtom = atom(false);

/**
 * Cache for full memory item configurations to avoid re-fetching
 * Key: itemId, Value: Configuration and timestamp
 */
export const memoryItemCacheAtom = atom<Record<string, {
  configuration: MemoryConfiguration;
  timestamp: number;
}>>({});

/**
 * Post-export nudge visibility (for logged-out users)
 */
export const showExportNudgeAtom = atom(false);

/**
 * Currently loaded memory item ID (if editing from memory)
 */
export const loadedMemoryItemIdAtom = atom<string | null>(null);

/**
 * Derived atom: Current configuration hash
 * Used for deduplication - checks if current state matches an existing memory item
 */
export const currentConfigHashAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  const screenshotGradient = get(screenshotGradientAtom);

  // Serialize current state (without screenshotPath which isn't known yet)
  const tempConfig = serializeEditorState({
    config,
    assets,
    screenshotGradient,
    orientation: "desktop", // This will be properly set during actual serialization
    screenshotZoom: 1.0,
    screenshotPath: "", // Placeholder
  });

  return computeConfigHash(tempConfig);
});

/**
 * Derived atom: Check if current config exists in memory
 * Returns true if an identical memory item already exists
 */
export const configExistsInMemoryAtom = atom((get) => {
  const currentHash = get(currentConfigHashAtom);
  const items = get(memoryItemsAtom);

  // We can't check hash directly from DTO, so for now return false
  // This will be properly implemented when we fetch full items or add hash to DTO
  return false;
});

/**
 * Progressive disclosure state: Track if user has any exports
 */
export const hasExportsAtom = atom(false);

/**
 * Progressive disclosure state: Track if there are unseen exports since last view
 */
export const hasUnseenExportsAtom = atom(false);

/**
 * Progressive disclosure state: Timestamp when user last viewed history
 */
export const lastViewedHistoryAtom = atom<number | null>(null);

/**
 * Derived atom: Count of unseen exports
 * Returns count of exports created after lastViewedHistory timestamp
 */
export const unseenExportCountAtom = atom((get) => {
  const items = get(memoryItemsAtom);
  const lastViewed = get(lastViewedHistoryAtom);

  // If never viewed, all items are unseen
  if (!lastViewed) return items.length;

  // Count items created after last view
  return items.filter((item) => new Date(item.createdAt).getTime() > lastViewed).length;
});

/**
 * Derived atom: Hash of current design configuration for change detection
 * Changes when user modifies any design aspect
 * Used to detect when to reset Export/Save button state
 */
export const currentDesignHashAtom = atom((get) => {
  const config = get(configAtom);
  const assets = get(assetsAtom);
  const screenshotGradient = get(screenshotGradientAtom);
  const orientation = get(orientationAtom);
  const screenshotZoom = get(screenshotZoomAtom);

  // Create a stable hash of current design state
  const stateSnapshot = JSON.stringify({
    layoutId: config.layoutId,
    variant: config.variant,
    background: config.background,
    fontStyle: config.fontStyle,
    screenshotFrame: config.screenshotFrame,
    orientation,
    screenshotZoom,
    assetCount: assets.length,
    screenshotGradient,
  });

  return stateSnapshot;
});

/**
 * Save count atom (number of saved designs)
 */
export const saveCountAtom = atom<number>(0);

/**
 * Save limit atom (uses shared constant)
 */
export const saveLimitAtom = atom<number>(SAVE_LIMIT);

/**
 * Derived atom: Current save count from items
 */
export const currentSaveCountAtom = atom((get) => {
  const items = get(memoryItemsAtom);
  return items.length;
});

/**
 * Track when a save just completed (for showing success indicator)
 * Auto-clears after 30 seconds or when sidebar is opened
 */
export const justSavedAtom = atom<boolean>(false);

/**
 * Track which item is currently being deleted (for showing loading state)
 */
export const deletingItemIdAtom = atom<string | null>(null);
