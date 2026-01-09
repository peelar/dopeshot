"use client";

import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  isSavingAtom,
  statusMessageAtom,
  configAtom,
  assetsAtom,
  screenshotGradientAtom,
  orientationAtom,
  screenshotZoomAtom,
  PLACEHOLDER_ASSET_ID,
} from "@/hooks/atoms";
import {
  memoryItemsAtom,
  saveCountAtom,
  saveLimitAtom,
  loadedMemoryItemIdAtom,
  justSavedAtom,
} from "@/hooks/atoms/memory";
import { serializeEditorState } from "@/domain/memory/config-serializer";
import { track } from "@/lib/analytics";
import type { MemoryItemDTO } from "@/domain/memory/types";
import { useSession } from "@/lib/auth/auth-client";
import { exportLayoutAsPngWithBlob } from "@/domain/layout/export";
import { compressImageBlob } from "@/lib/utils/image-compression";
import { EXPORT_ORIENTATION_DIMENSIONS } from "@/domain/layout/screenshot-mode";
import { setMemoryUrl } from "@/lib/memory/memory-url";
import { toast } from "@/lib/utils/toast";

export function useSaveDesign() {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useAtom(isSavingAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const [items, setItems] = useAtom(memoryItemsAtom);
  const [saveCount, setSaveCount] = useAtom(saveCountAtom);
  const saveLimit = useAtomValue(saveLimitAtom);
  const setLoadedItemId = useSetAtom(loadedMemoryItemIdAtom);
  const setJustSaved = useSetAtom(justSavedAtom);

  // Current editor state
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshotGradient = useAtomValue(screenshotGradientAtom);
  const orientation = useAtomValue(orientationAtom);
  const screenshotZoom = useAtomValue(screenshotZoomAtom);

  const isDemoDesign =
    assets.some((asset) => asset.projectId === "demo" || asset.userId === "demo") ||
    config.assets.screenshot === PLACEHOLDER_ASSET_ID;

  const canSave = Boolean(session?.user?.id) && saveCount < saveLimit && !isDemoDesign;
  const isAtLimit = saveCount >= saveLimit;

  const saveDesign = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      setStatusMessage("Please sign in to save designs.");
      toast.error("Sign in required", {
        description: "Please sign in to save your designs.",
      });
      return false;
    }

    if (isDemoDesign) {
      setStatusMessage("Demo designs can't be saved.");
      toast.error("Demo design", {
        description: "Start a new design or upload a screenshot to save.",
      });
      return false;
    }

    if (saveCount >= saveLimit) {
      setStatusMessage("Save limit reached. Delete a saved design first.");
      toast.error("Save limit reached", {
        description: `Delete a saved design to save this one (${saveCount}/${saveLimit})`,
      });
      track("save_limit_reached", { limit: saveLimit });
      return false;
    }

    setIsSaving(true);
    setStatusMessage("Saving design...");

    try {
      // Generate screenshot for this save (independent of export)
      const exportDims = EXPORT_ORIENTATION_DIMENSIONS[orientation];
      const { blob: rawBlob } = await exportLayoutAsPngWithBlob("export-container", {
        width: exportDims.width,
        height: exportDims.height,
      });

      // Compress image to stay under Vercel's 4.5MB payload limit
      const { blob, wasCompressed, originalSize, finalSize } = await compressImageBlob(rawBlob);

      if (wasCompressed) {
        console.log(
          `Screenshot compressed: ${(originalSize / 1024).toFixed(0)}KB → ${(finalSize / 1024).toFixed(0)}KB`
        );
      }

      // Serialize current state
      const screenshotPath = `${session.user.id}/${Date.now()}.png`;
      const configuration = serializeEditorState({
        config,
        assets,
        screenshotGradient,
        orientation,
        screenshotZoom,
        screenshotPath,
      });

      // Prepare form data - use correct extension based on blob type
      const extension = blob.type === "image/jpeg" ? "jpg" : "png";
      const formData = new FormData();
      formData.append("configuration", JSON.stringify(configuration));
      formData.append("screenshot", blob, `screenshot.${extension}`);

      // Send to API
      const response = await fetch("/api/memory/items", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 403) {
          // Limit reached
          const errorData = await response.json();
          const errorMessage = errorData.message || "Save limit reached";
          setStatusMessage(errorMessage);
          toast.error("Save limit reached", {
            description: errorMessage,
          });
          track("save_limit_reached_server", { limit: saveLimit });
          return false;
        }
        throw new Error("Failed to save design");
      }

      const data = await response.json();
      const newItem: MemoryItemDTO = data.item;
      const isDuplicate = data.duplicate || false;

      // Optimistic update
      if (!isDuplicate) {
        setItems((prev) => [newItem, ...prev]);
        setSaveCount((prev) => prev + 1);
      }

      // Update selection
      setLoadedItemId(newItem.id);

      // Update URL
      setMemoryUrl(newItem.id);

      setStatusMessage(isDuplicate ? "Design already saved" : "Design saved successfully");

      // Show success toast
      if (isDuplicate) {
        toast.info("Already saved", {
          description: "This design was already in your collection.",
        });
      } else {
        toast.success("Design saved", {
          description: "Your design has been saved successfully.",
        });
      }

      // Show success indicator
      setJustSaved(true);

      // Track events
      track("design_saved", {
        item_id: newItem.id,
        duplicate: isDuplicate,
        save_count: saveCount + (isDuplicate ? 0 : 1),
        independent_save: true, // Track that this is the new independent save flow
      });

      return true;
    } catch (error) {
      console.error("Failed to save design:", error);
      setStatusMessage("Failed to save design");

      // Show error toast with retry action
      toast.error("Failed to save design", {
        description: "Something went wrong. Please try again.",
        action: {
          label: "Retry",
          onClick: () => {
            track("design_save_retry_clicked");
            saveDesign();
          },
        },
      });

      track("design_save_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    session,
    saveCount,
    saveLimit,
    isDemoDesign,
    config,
    assets,
    screenshotGradient,
    orientation,
    screenshotZoom,
    setIsSaving,
    setStatusMessage,
    setItems,
    setSaveCount,
    setLoadedItemId,
    setJustSaved,
  ]);

  return {
    saveDesign,
    canSave,
    isAtLimit,
    isSaving,
    saveCount,
    saveLimit,
  };
}
