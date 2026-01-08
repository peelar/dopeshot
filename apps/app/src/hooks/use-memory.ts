"use client";

import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  memoryItemsAtom,
  memoryLoadingAtom,
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
  screenshotGradientAtom,
  orientationAtom,
  screenshotZoomAtom,
} from "@/hooks/atoms";
import { serializeEditorState } from "@/domain/memory/config-serializer";
import { deserializeEditorState } from "@/domain/memory/config-loader";
import { setMemoryState } from "@/lib/storage/memory-state";
import { setMemoryUrl } from "@/lib/memory/memory-url";
import { toast } from "@/lib/utils/toast";
import type { MemoryItemDTO, MemoryConfiguration } from "@/domain/memory/types";

export function useMemory() {
  const [items, setItems] = useAtom(memoryItemsAtom);
  const [isLoading, setIsLoading] = useAtom(memoryLoadingAtom);
  const setLoadedItemId = useSetAtom(loadedMemoryItemIdAtom);
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
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setOrientation = useSetAtom(orientationAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);

  /**
   * Fetch memory items with pagination support
   */
  const fetchMemoryItems = useCallback(
    async (cursor?: string): Promise<{ hasMore: boolean; nextCursor: string | null }> => {
      setIsLoading(true);
      try {
        const url = new URL("/api/memory/items", window.location.origin);
        url.searchParams.set("limit", "10");
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const response = await fetch(url.toString());
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
          hasMore: pagination.hasMore,
          nextCursor: pagination.nextCursor,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch saved designs";
        console.error("Failed to fetch memory items:", error);

        toast.error("Failed to load saved designs", {
          description: errorMessage,
        });

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setItems, hasExports, setHasExports, setSaveCount],
  );

  /**
   * Load a memory item and hydrate editor state
   */
  const loadMemoryItem = useCallback(
    async (itemId: string): Promise<void> => {
      setIsLoading(true);
      try {
        // Fetch full memory item with configuration
        const response = await fetch(`/api/memory/items/${itemId}`);
        if (!response.ok) {
          throw new Error("Failed to load memory item");
        }

        const data = await response.json();
        const configuration: MemoryConfiguration = data.item.configuration;

        // Deserialize and hydrate editor state
        const state = deserializeEditorState(configuration);

        setConfig(state.config);
        setScreenshotGradient(state.screenshotGradient);
        setOrientation(state.orientation);
        setScreenshotZoom(state.screenshotZoom);
        setLoadedItemId(itemId);

        // Update URL with memory item ID
        setMemoryUrl(itemId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load saved design";
        console.error("Failed to load memory item:", error);

        toast.error("Failed to load design", {
          description: errorMessage,
        });

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setConfig, setScreenshotGradient, setOrientation, setScreenshotZoom, setLoadedItemId],
  );

  return {
    items,
    isLoading,
    fetchMemoryItems,
    loadMemoryItem,
  };
}
