import { useCallback } from "react";
import { useSetAtom, useAtom } from "jotai";
import { Asset } from "@/domain/asset/types";
import { processFileUpload } from "@/domain/asset/upload-orchestrator";
import { applyTemplateRecommendation, ASPECT_COPY } from "@/domain/layout/recommendations";
import { getRecommendationForAspectCategory } from "@/domain/layout/recommendations";
import { AspectCategory } from "@/domain/layout/aspect";
import {
  configAtom,
  assetsAtom,
  statusMessageAtom,
  isProcessingUploadAtom,
  hasCustomScreenshotAtom,
} from "./atoms";
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
              grainEnabled,
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
              },
            };
          }

          if (kind === "screenshot" && aspectCategory) {
            const recommendation = getRecommendationForAspectCategory(aspectCategory);
            const result = applyTemplateRecommendation(nextConfig, recommendation);
            nextConfig = result.config;

            if ((result.changedTemplate || result.changedVariant) && result.templateName) {
              setStatusMessage(
                `Detected ${ASPECT_COPY[aspectCategory] || aspectCategory} screenshot — switched to ${result.templateName}.`,
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
    ],
  );

  return {
    handleFileProcess,
    isProcessingUpload,
  };
}
