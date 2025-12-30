"use client";

import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  memoryItemsAtom,
  memoryLoadingAtom,
  loadedMemoryItemIdAtom,
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
import { track } from "@/lib/analytics";
import type { MemoryItemDTO, MemoryConfiguration } from "@/domain/memory/types";

export function useMemory() {
  const [items, setItems] = useAtom(memoryItemsAtom);
  const [isLoading, setIsLoading] = useAtom(memoryLoadingAtom);
  const setLoadedItemId = useSetAtom(loadedMemoryItemIdAtom);

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
   * Create a memory item from current editor state + screenshot blob
   */
  const createMemoryItem = useCallback(
    async (screenshotBlob: Blob, screenshotPath: string): Promise<void> => {
      try {
        // Serialize current state
        const configuration = serializeEditorState({
          config,
          assets,
          screenshotGradient,
          orientation,
          screenshotZoom,
          screenshotPath,
        });

        // Prepare form data
        const formData = new FormData();
        formData.append("configuration", JSON.stringify(configuration));
        formData.append("screenshot", screenshotBlob, "screenshot.png");

        // Send to API
        const response = await fetch("/api/memory/items", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to create memory item");
        }

        const data = await response.json();
        const newItem: MemoryItemDTO = data.item;

        // Optimistic update - add to list
        setItems((prev) => [newItem, ...prev]);

        // Track event
        track("memory_item_created", {
          item_id: newItem.id,
          duplicate: data.duplicate || false,
        });
      } catch (error) {
        console.error("Failed to create memory item:", error);
        throw error;
      }
    },
    [config, assets, screenshotGradient, orientation, screenshotZoom, setItems],
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

        // Track event
        track("memory_item_loaded", {
          item_id: itemId,
        });
      } catch (error) {
        console.error("Failed to load memory item:", error);
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
    createMemoryItem,
    loadMemoryItem,
  };
}
