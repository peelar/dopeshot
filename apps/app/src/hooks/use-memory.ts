"use client";

import { useCallback, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSession } from "@/lib/auth/auth-client";
import {
  memoryItemsAtom,
  memoryLoadingAtom,
  memoryItemCacheAtom,
  loadedMemoryItemIdAtom,
  hasExportsAtom,
  hasUnseenExportsAtom,
  lastViewedHistoryAtom,
  memorySidebarOpenAtom,
  saveCountAtom,
} from "@/hooks/atoms/memory";
import {
  configAtom,
  assetsAtom,
  hasCustomScreenshotAtom,
  screenshotGradientAtom,
  orientationAtom,
  screenshotZoomAtom,
  statusMessageAtom,
  getEmptyCanvasConfig,
} from "@/hooks/atoms";
import { serializeEditorState } from "@/domain/memory/config-serializer";
import { deserializeEditorState } from "@/domain/memory/config-loader";
import { setMemoryState } from "@/lib/storage/memory-state";
import { setMemoryUrl, clearMemoryUrl } from "@/lib/memory/memory-url";
import { track } from "@/lib/analytics";
import type { MemoryItemDTO, MemoryConfiguration } from "@/domain/memory/types";

export function useMemory() {
  const { data: session } = useSession();
  const user = session?.user;
  const [items, setItems] = useAtom(memoryItemsAtom);
  const [isLoading, setIsLoading] = useAtom(memoryLoadingAtom);
  const [itemCache, setItemCache] = useAtom(memoryItemCacheAtom);
  const [loadedItemId, setLoadedItemId] = useAtom(loadedMemoryItemIdAtom);
  const [hasExports, setHasExports] = useAtom(hasExportsAtom);
  const setHasUnseenExports = useSetAtom(hasUnseenExportsAtom);
  const setLastViewed = useSetAtom(lastViewedHistoryAtom);
  const isOpen = useAtomValue(memorySidebarOpenAtom);
  const setSaveCount = useSetAtom(saveCountAtom);

  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshotGradient = useAtomValue(screenshotGradientAtom);
  const orientation = useAtomValue(orientationAtom);
  const screenshotZoom = useAtomValue(screenshotZoomAtom);

  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setHasCustomScreenshot = useSetAtom(hasCustomScreenshotAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setOrientation = useSetAtom(orientationAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  const resetToEmptyCanvas = useCallback(() => {
    setConfig(getEmptyCanvasConfig());
    setAssets([]);
    setScreenshotGradient(null);
    setScreenshotZoom(1.0);
    setHasCustomScreenshot(false);
    setLoadedItemId(null);
    clearMemoryUrl();
  }, [
    setAssets,
    setConfig,
    setHasCustomScreenshot,
    setLoadedItemId,
    setScreenshotGradient,
    setScreenshotZoom,
  ]);

  // Reset state when user changes (login/logout)
  useEffect(() => {
    if (!user?.id) {
      setItems([]);
      setSaveCount(0);
    }
  }, [user?.id, setItems, setSaveCount]);

  /**
   * Fetch memory items with pagination support
   */
  const fetchMemoryItems = useCallback(
    async (
      cursor?: string,
    ): Promise<{ items: MemoryItemDTO[]; hasMore: boolean; nextCursor: string | null }> => {
      setIsLoading(true);
      try {
        const url = new URL("/api/memory/items", window.location.origin);
        url.searchParams.set("limit", "10");
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const response = await fetch(url.toString(), { cache: "no-store" });
        if (response.status === 401 || response.status === 404) {
          if (!cursor) {
            setItems([]);
            setSaveCount(0);
          }

          return {
            items: [],
            hasMore: false,
            nextCursor: null,
          };
        }

        if (!response.ok) {
          throw new Error("Failed to fetch memory items");
        }

        const data = await response.json();
        const newItems: MemoryItemDTO[] = data.items;
        const pagination = data.pagination;

        // Append or replace items
        if (cursor) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
          // Update save count on initial fetch
          setSaveCount(newItems.length);
        }

        // Update hasExports state based on whether items exist
        if (newItems.length > 0 && !hasExports) {
          setHasExports(true);
          setMemoryState({ hasExports: true });
        }

        return {
          items: newItems,
          hasMore: pagination.hasMore,
          nextCursor: pagination.nextCursor,
        };
      } catch (error) {
        console.error("Failed to fetch memory items:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setItems, hasExports, setHasExports, setSaveCount, user?.id],
  );

  /**
   * Load a memory item and hydrate editor state
   */
  const loadMemoryItem = useCallback(
    async (itemId: string): Promise<void> => {
      // Check cache first
      if (itemCache[itemId]) {
        const { configuration } = itemCache[itemId];
        const state = deserializeEditorState(configuration);

        setConfig(state.config);
        setAssets(state.assets ?? []);
        setHasCustomScreenshot(Boolean(state.config.assets.screenshot));
        setScreenshotGradient(state.screenshotGradient);
        setOrientation(state.orientation);
        setScreenshotZoom(state.screenshotZoom);
        setLoadedItemId(itemId);
        setMemoryUrl(itemId);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch full memory item with configuration
        const response = await fetch(`/api/memory/items/${itemId}`);
        if (!response.ok) {
          throw new Error("Failed to load memory item");
        }

        const data = await response.json();
        const configuration: MemoryConfiguration = data.item.configuration;

        // Update cache
        setItemCache((prev) => ({
          ...prev,
          [itemId]: {
            configuration,
            timestamp: Date.now(),
          },
        }));

        // Deserialize and hydrate editor state
        const state = deserializeEditorState(configuration);

        setConfig(state.config);
        setAssets(state.assets ?? []);
        setHasCustomScreenshot(Boolean(state.config.assets.screenshot));
        setScreenshotGradient(state.screenshotGradient);
        setOrientation(state.orientation);
        setScreenshotZoom(state.screenshotZoom);
        setLoadedItemId(itemId);

        // Update URL with memory item ID
        setMemoryUrl(itemId);
      } catch (error) {
        console.error("Failed to load memory item:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      itemCache,
      setItemCache,
      setIsLoading,
      setConfig,
      setAssets,
      setHasCustomScreenshot,
      setScreenshotGradient,
      setOrientation,
      setScreenshotZoom,
      setLoadedItemId,
    ],
  );

  /**
   * Delete a memory item and select the next available one if it was loaded
   */
  const deleteDesign = useCallback(
    async (itemId: string): Promise<boolean> => {
      // Find the item to delete (for potential rollback and next selection)
      const itemToDelete = items.find((item) => item.id === itemId);
      if (!itemToDelete) {
        return false;
      }

      const wasLoaded = loadedItemId === itemId;
      const itemIndex = items.findIndex((item) => item.id === itemId);
      const itemsBeforeDelete = [...items];

      // Optimistic update - remove immediately
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setSaveCount((prev) => Math.max(0, prev - 1));

      // Evict from item cache to prevent stale data when navigating to deleted item URL
      setItemCache((prev) => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });

      // If deleting currently loaded item, select next available one
      if (wasLoaded) {
        const remainingItems = itemsBeforeDelete.filter((item) => item.id !== itemId);
        if (remainingItems.length > 0) {
          // Select item at same index (which is now the next one) or the last one
          const nextItem = remainingItems[itemIndex] || remainingItems[remainingItems.length - 1];
          if (nextItem) {
            loadMemoryItem(nextItem.id).catch(console.error);
          }
        } else {
          resetToEmptyCanvas();
        }
      }

      try {
        setStatusMessage("Deleting design...");

        const response = await fetch(`/api/memory/items/${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete design");
        }

        setStatusMessage("Design deleted successfully");

        track("design_deleted", {
          item_id: itemId,
          remaining_count: itemsBeforeDelete.length - 1,
        });

        return true;
      } catch (error) {
        console.error("Failed to delete design:", error);
        setStatusMessage("Failed to delete design. Restoring...");

        // Rollback - restore the item at its original position
        setItems((prev) => {
          const newItems = [...prev];
          newItems.splice(itemIndex, 0, itemToDelete);
          return newItems;
        });
        setSaveCount((prev) => prev + 1);

        // Restore loaded state if it was loaded
        if (wasLoaded) {
          loadMemoryItem(itemId).catch(console.error);
        }

        return false;
      }
    },
    [
      items,
      loadedItemId,
      setItems,
      setSaveCount,
      loadMemoryItem,
      resetToEmptyCanvas,
      setStatusMessage,
    ],
  );

  return {
    items,
    isLoading,
    fetchMemoryItems,
    loadMemoryItem,
    deleteDesign,
    resetToEmptyCanvas,
  };
}

