import { useCallback } from "react";
import { useSetAtom, useAtom } from "jotai";
import { track } from "@vercel/analytics";
import { Asset } from "@/domain/asset/types";
import { processFileUpload } from "@/domain/asset/upload-orchestrator";
import { applyLookRecommendation, ASPECT_COPY, getRecommendationForAspectCategory } from "@/domain/layout/recommendations";
import { AspectCategory } from "@/domain/layout/aspect";
import {
  configAtom,
  assetsAtom,
  statusMessageAtom,
  isProcessingUploadAtom,
  hasCustomScreenshotAtom,
} from "./atoms";
import { expandSidebarSectionAtom } from "./use-sidebar-state";
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
          track("background_image_uploaded", {
            file_size_kb: Math.round(file.size / 1024),
          });
        } else if (kind === "logo") {
          track("logo_uploaded", {
            file_size_kb: Math.round(file.size / 1024),
          });
        }

        setConfig((currentConfig) => {
          const grainEnabled = currentConfig.background?.grainEnabled ?? true;
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
              grainEnabled: false,
              patternMode: "manual",
              patternId: "none",
            };
          }

          let nextConfig = newConfig;

          if (kind === "screenshot") {
            nextConfig = {
              ...nextConfig,
              background: {
                type: "solid",
                value: "slate-100",
                grainEnabled,
                patternMode: "auto",
              },
            };
          }

          if (kind === "screenshot" && aspectCategory) {
            const recommendation = getRecommendationForAspectCategory(aspectCategory);
            const result = applyLookRecommendation(nextConfig, recommendation);
            nextConfig = result.config;

            if ((result.changedLook || result.changedVariant) && result.lookName) {
              setStatusMessage(
                `Detected ${ASPECT_COPY[aspectCategory] || aspectCategory} screenshot — switched to ${result.lookName}.`,
              );
            }
          }

          return nextConfig;
        });

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
        setStatusMessage("Failed to read file. Please try another image.");
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
      setHasCustomScreenshot,
      onScreenshotUploaded,
      processColorAnalysis,
      expandSidebarSection,
    ],
  );

  return {
    handleFileProcess,
    isProcessingUpload,
  };
}
