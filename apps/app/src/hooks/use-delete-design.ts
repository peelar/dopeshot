"use client";

import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { memoryItemsAtom, saveCountAtom, loadedMemoryItemIdAtom } from "@/hooks/atoms/memory";
import { statusMessageAtom } from "@/hooks/atoms";
import { track } from "@/lib/analytics";
import { clearMemoryUrl, setMemoryUrl } from "@/lib/memory/memory-url";

export function useDeleteDesign() {
  const [items, setItems] = useAtom(memoryItemsAtom);
  const setSaveCount = useSetAtom(saveCountAtom);
  const [loadedItemId, setLoadedItemId] = useAtom(loadedMemoryItemIdAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  const deleteDesign = useCallback(
    async (itemId: string): Promise<boolean> => {
      // Find the item to delete (for potential rollback)
      const itemToDelete = items.find((item) => item.id === itemId);
      if (!itemToDelete) {
        return false;
      }

      // Store the index for proper rollback
      const itemIndex = items.findIndex((item) => item.id === itemId);

      // Optimistic update - remove immediately
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setSaveCount((prev) => Math.max(0, prev - 1));

      // Clear loaded state if deleting current item
      const wasLoaded = loadedItemId === itemId;
      if (wasLoaded) {
        setLoadedItemId(null);

        // Clear URL param
        clearMemoryUrl();
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
          remaining_count: items.length - 1,
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
          setLoadedItemId(itemId);

          // Restore URL param
          setMemoryUrl(itemId);
        }

        return false;
      }
    },
    [items, loadedItemId, setItems, setSaveCount, setLoadedItemId, setStatusMessage],
  );

  return { deleteDesign };
}
