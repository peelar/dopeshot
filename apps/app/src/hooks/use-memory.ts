"use client";

import { useCallback, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSession } from "@/lib/auth/auth-client";
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
  hasCustomScreenshotAtom,
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
  const { data: session } = useSession();
  const user = session?.user;
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
  const setHasCustomScreenshot = useSetAtom(hasCustomScreenshotAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setOrientation = useSetAtom(orientationAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);

  // Hydrate from localStorage when user is available
  useEffect(() => {
    if (user?.id) {
      const key = `dopeshot-memory-items-${user.id}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
            setSaveCount(parsed.length);
            setHasExports(true);
            setMemoryState({ hasExports: true });
          }
        } catch (e) {
          console.error("Failed to parse cached memory items", e);
        }
      }
    } else {
      setItems([]);
      setSaveCount(0);
    }
  }, [user?.id, setItems, setSaveCount, setHasExports]);

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

        const response = await fetch(url.toString());
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
          setItems((prev) => {
            const updated = [...prev, ...newItems];
            // Update cache with accumulated items
            if (user?.id) {
              localStorage.setItem(`dopeshot-memory-items-${user.id}`, JSON.stringify(updated));
            }
            return updated;
          });
        } else {
          setItems(newItems);
          // Update save count on initial fetch
          setSaveCount(newItems.length);
          
          // Update cache
          if (user?.id) {
            localStorage.setItem(`dopeshot-memory-items-${user.id}`, JSON.stringify(newItems));
          }
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
    [setIsLoading, setItems, hasExports, setHasExports, setSaveCount, user?.id],
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
        setAssets(state.assets ?? []);
        setHasCustomScreenshot(Boolean(state.config.assets.screenshot));
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
    [
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

  return {
    items,
    isLoading,
    fetchMemoryItems,
    loadMemoryItem,
  };
}
