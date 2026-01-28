"use client";

import { useCallback, useState } from "react";
import { uploadPersonalBackground } from "@/domain/backgrounds/background-service";
import { compressImageBlob } from "@/lib/utils/image-compression";
import { cropImageToAspectRatio } from "@/lib/utils/image-crop";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/utils/toast";
import { TARGET_ASPECT_RATIO } from "@/domain/backgrounds/constants";
import type { PersonalBackground } from "@/domain/backgrounds/types";

export interface UploadResult {
  background: PersonalBackground;
  metrics: {
    fileSizeKb: number;
    wasCompressed: boolean;
    wasCropped: boolean;
    originalSizeKb: number;
    originalDimensions: string;
    finalDimensions: string;
  };
}

interface UseBackgroundUploadOptions {
  /** Called when upload succeeds */
  onSuccess?: (result: UploadResult) => void;
  /** Called when upload fails */
  onError?: (error: Error) => void;
  /** Show toast notifications (default: true) */
  showToasts?: boolean;
  /** Track analytics events (default: true) */
  trackAnalytics?: boolean;
}

async function getBlobDimensions(
  blob: Blob,
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap !== "undefined") {
    const bitmap = await createImageBitmap(blob);
    return { width: bitmap.width, height: bitmap.height };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions"));
    };

    img.src = url;
  });
}

export function useBackgroundUpload(options: UseBackgroundUploadOptions = {}) {
  const {
    onSuccess,
    onError,
    showToasts = true,
    trackAnalytics = true,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedBackground, setUploadedBackground] = useState<PersonalBackground | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        // Step 1: Crop to 16:9 aspect ratio (center crop)
        const cropped = await cropImageToAspectRatio(file, {
          targetAspectRatio: TARGET_ASPECT_RATIO,
          maxWidth: 3840, // 4K max width
        });

        // Step 2: Compress the cropped image
        const compressed = await compressImageBlob(cropped.blob, {
          maxSizeKB: 2048, // 2MB target for backgrounds
          initialQuality: 0.92,
          minQuality: 0.7,
          maxWidth: 3840,
        });

        const fileToUpload = new File(
          [compressed.blob],
          file.name,
          { type: compressed.blob.type || file.type },
        );

        const { width: finalWidth, height: finalHeight } = await getBlobDimensions(
          compressed.blob,
        ).catch(() => ({
          width: cropped.finalWidth,
          height: cropped.finalHeight,
        }));

        const background = await uploadPersonalBackground({
          file: fileToUpload,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          widthPx: finalWidth,
          heightPx: finalHeight,
          fileFormat: file.name.split(".").pop()?.toLowerCase() || "jpg",
        });

        const metrics = {
          fileSizeKb: Math.round(compressed.finalSize / 1024),
          wasCompressed: compressed.wasCompressed,
          wasCropped: cropped.wasCropped,
          originalSizeKb: Math.round(compressed.originalSize / 1024),
          originalDimensions: `${cropped.originalWidth}x${cropped.originalHeight}`,
          finalDimensions: `${finalWidth}x${finalHeight}`,
        };

        if (trackAnalytics) {
          track("brand_background_uploaded", {
            file_size_kb: metrics.fileSizeKb,
            was_compressed: metrics.wasCompressed,
            was_cropped: metrics.wasCropped,
            original_size_kb: metrics.originalSizeKb,
            original_dimensions: metrics.originalDimensions,
            final_dimensions: metrics.finalDimensions,
          });
        }

        if (showToasts) {
          toast.success("Background uploaded");
        }

        const result = { background, metrics };
        setUploadedBackground(background);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const uploadError = err instanceof Error ? err : new Error("Failed to upload background");
        setError(uploadError);
        
        if (showToasts) {
          toast.error(uploadError.message);
        }
        
        onError?.(uploadError);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess, onError, showToasts, trackAnalytics],
  );

  const reset = useCallback(() => {
    setUploadedBackground(null);
    setError(null);
  }, []);

  return {
    upload,
    reset,
    isUploading,
    uploadedBackground,
    error,
  };
}
