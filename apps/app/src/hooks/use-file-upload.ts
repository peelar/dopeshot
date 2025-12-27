import { useCallback } from "react";
import { useSetAtom, useAtom, useAtomValue } from "jotai";
import { track } from "@/lib/analytics";
import { Asset } from "@/domain/asset/types";
import { processFileUpload } from "@/domain/asset/upload-orchestrator";
import { analyzeImageTextContrast } from "@/domain/asset/image-text-contrast";
import { applyLayoutRecommendation, ASPECT_COPY, getRecommendationForAspectCategory } from "@/domain/layout/recommendations";
import { AspectCategory } from "@/domain/layout/aspect";
import { saveBackgroundSelection } from "@/domain/backgrounds/background-service";
import {
  configAtom,
  assetsAtom,
  statusMessageAtom,
  isProcessingUploadAtom,
  hasCustomScreenshotAtom,
} from "./atoms";
import { expandSidebarSectionAtom } from "./use-sidebar-state";
import { backgroundSelectionAtom, backgroundUserTierAtom } from "./atoms/backgrounds";
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const ACCEPTED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface UseFileUploadOptions {
  onScreenshotUploaded?: (asset: Asset, aspectCategory?: AspectCategory) => Promise<void>;
  processColorAnalysis?: (
    dataUrl: string,
    assetId: string,
    autoLayoutMessage: string | null,
  ) => Promise<void>;
}

export function useFileUpload({
  onScreenshotUploaded,
  processColorAnalysis,
}: UseFileUploadOptions) {
  const [isProcessingUpload, setIsProcessingUpload] = useAtom(isProcessingUploadAtom);
  const backgroundUserTier = useAtomValue(backgroundUserTierAtom);
  const setBackgroundSelection = useSetAtom(backgroundSelectionAtom);
  const setBackgroundUserTier = useSetAtom(backgroundUserTierAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setConfig = useSetAtom(configAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const setHasCustomScreenshot = useSetAtom(hasCustomScreenshotAtom);
  const expandSidebarSection = useSetAtom(expandSidebarSectionAtom);

  const validateFile = useCallback(
    (file: File) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const matchesMime = file.type ? ACCEPTED_IMAGE_TYPES.has(file.type) : false;
      const matchesExtension = extension ? ACCEPTED_EXTENSIONS.has(extension) : false;

      if (!(matchesMime || matchesExtension)) {
        setStatusMessage("Unsupported format. Use PNG, JPG, WebP, or SVG.");
        return false;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setStatusMessage("File is too large. Max size is 10MB.");
        return false;
      }

      return true;
    },
    [setStatusMessage],
  );

  const handleFileProcess = useCallback(
    async (file: File, kind: "screenshot" | "logo" | "background" = "screenshot") => {
      if (!validateFile(file)) {
        return;
      }
      setIsProcessingUpload(true);

      try {
        if (kind === "background") {
          const extension = file.name.split(".").pop()?.toLowerCase();
          const fileType = file.type || extension || "unknown";
          track("background_upload_started", {
            user_tier: backgroundUserTier,
            file_type: fileType,
            file_size_kb: Math.round(file.size / 1024),
          });
        }

        const result = await processFileUpload(file, kind);
        const { asset, aspectCategory } = result;

        setAssets((prev) => [...prev, asset]);
        setStatusMessage(`${kind.charAt(0).toUpperCase() + kind.slice(1)} uploaded: ${file.name}`);

        if (kind === "screenshot") {
          setHasCustomScreenshot(true);
          track("screenshot_uploaded", {
            aspect_category: aspectCategory || "unknown",
            file_size_kb: Math.round(file.size / 1024),
          });
        } else if (kind === "background") {
          track("background_upload_completed", {
            background_id: asset.id,
            user_tier: backgroundUserTier,
          });
          try {
            const selection = await saveBackgroundSelection({
              backgroundType: "personal",
              backgroundId: asset.id,
            });
            setBackgroundSelection({
              backgroundType: selection.backgroundType,
              backgroundId: selection.backgroundId,
            });
            if (selection.userTier) {
              setBackgroundUserTier(selection.userTier);
            }
          } catch (error) {
            setStatusMessage(
              "Background uploaded, but selection could not be saved. Please reselect it.",
            );
          }
        } else if (kind === "logo") {
          track("logo_uploaded", {
            file_size_kb: Math.round(file.size / 1024),
          });
        }

        setConfig((currentConfig) => {
          const newConfig = {
            ...currentConfig,
            assets: {
              ...currentConfig.assets,
              [kind]: asset.id,
            },
          };

          if (kind === "background") {
            newConfig.background = {
              type: "image",
              value: asset.id,
            };
          }

          let nextConfig = newConfig;

          if (kind === "screenshot") {
            nextConfig = {
              ...nextConfig,
              background: {
                type: "solid",
                value: "slate-100",
              },
            };
          }

          if (kind === "screenshot" && aspectCategory) {
            const recommendation = getRecommendationForAspectCategory(aspectCategory);
            const result = applyLayoutRecommendation(nextConfig, recommendation);
            nextConfig = result.config;

            if ((result.changedLayout || result.changedVariant) && result.layoutName) {
              setStatusMessage(
                `Detected ${ASPECT_COPY[aspectCategory] || aspectCategory} screenshot — switched to ${result.layoutName}.`,
              );
            }
          }

          return nextConfig;
        });

        if (kind === "background") {
          const { palette, textColor } = await analyzeImageTextContrast(asset.url);
          if (palette) {
            setAssets((prev) =>
              prev.map((existing) =>
                existing.id === asset.id ? { ...existing, colorPalette: palette } : existing,
              ),
            );
          }

          if (textColor) {
            setConfig((currentConfig) => {
              if (
                currentConfig.background?.type !== "image" ||
                currentConfig.background.value !== asset.id
              ) {
                return currentConfig;
              }

              return {
                ...currentConfig,
                colors: {
                  ...currentConfig.colors,
                  text: textColor,
                },
              };
            });
          }
        }

        if (kind === "screenshot" && onScreenshotUploaded && aspectCategory) {
          await onScreenshotUploaded(asset, aspectCategory);
        }

        if (kind === "screenshot" && processColorAnalysis) {
          await processColorAnalysis(asset.url, asset.id, null);
        }

        // Auto-expand relevant sections after upload
        if (kind === "screenshot") {
          // Expand background section after screenshot upload
          expandSidebarSection("background");
        } else if (kind === "logo") {
          // Expand look section after logo upload
          expandSidebarSection("look");
        } else if (kind === "background") {
          // Expand look section after background upload
          expandSidebarSection("look");
        }
      } catch (error) {
        if (kind === "background") {
          track("background_upload_failed", {
            error_reason: error instanceof Error ? error.message : "unknown",
            user_tier: backgroundUserTier,
          });
        }
        const message =
          error instanceof Error ? error.message : "Failed to read file. Please try another image.";
        setStatusMessage(message);
        console.error("File upload error:", error);
      } finally {
        setIsProcessingUpload(false);
      }
    },
    [
      validateFile,
      setIsProcessingUpload,
      setAssets,
      setConfig,
      setStatusMessage,
      setBackgroundSelection,
      setBackgroundUserTier,
      setHasCustomScreenshot,
      onScreenshotUploaded,
      processColorAnalysis,
      expandSidebarSection,
      backgroundUserTier,
    ],
  );

  return {
    handleFileProcess,
    isProcessingUpload,
  };
}
