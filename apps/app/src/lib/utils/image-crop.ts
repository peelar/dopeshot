/**
 * Image cropping utilities for dopeshot.
 * Used to normalize brand backgrounds to target aspect ratio (16:9).
 */

export interface CropOptions {
  /** Target aspect ratio (width/height, default: 16/9) */
  targetAspectRatio?: number;
  /** Maximum width after crop (optional) */
  maxWidth?: number;
}

export interface CroppedImage {
  blob: Blob;
  wasCropped: boolean;
  originalWidth: number;
  originalHeight: number;
  finalWidth: number;
  finalHeight: number;
}

const DEFAULT_TARGET_ASPECT_RATIO = 16 / 9;

/**
 * Check if modern canvas APIs are available
 */
function hasModernCanvasSupport(): boolean {
  return (
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  );
}

/**
 * Crops a Blob image to the target aspect ratio using center crop.
 * If the image is already at the target ratio, returns it unchanged.
 */
export async function cropImageToAspectRatio(
  blob: Blob,
  options: CropOptions = {}
): Promise<CroppedImage> {
  const targetAspectRatio = options.targetAspectRatio ?? DEFAULT_TARGET_ASPECT_RATIO;

  // Convert blob to image for processing
  const imageBitmap = await createImageBitmap(blob);
  const { width: originalWidth, height: originalHeight } = imageBitmap;
  const currentAspectRatio = originalWidth / originalHeight;

  // Check if already at target aspect ratio (within 0.1% tolerance)
  if (Math.abs(currentAspectRatio - targetAspectRatio) < 0.001) {
    return {
      blob,
      wasCropped: false,
      originalWidth,
      originalHeight,
      finalWidth: originalWidth,
      finalHeight: originalHeight,
    };
  }

  // Calculate crop dimensions (center crop)
  let cropWidth: number;
  let cropHeight: number;
  let cropX: number;
  let cropY: number;

  if (currentAspectRatio > targetAspectRatio) {
    // Image is wider than target - crop width
    cropHeight = originalHeight;
    cropWidth = Math.round(cropHeight * targetAspectRatio);
    cropX = Math.round((originalWidth - cropWidth) / 2);
    cropY = 0;
  } else {
    // Image is taller than target - crop height
    cropWidth = originalWidth;
    cropHeight = Math.round(cropWidth / targetAspectRatio);
    cropX = 0;
    cropY = Math.round((originalHeight - cropHeight) / 2);
  }

  // Apply max width constraint if specified
  let finalWidth = cropWidth;
  let finalHeight = cropHeight;
  if (options.maxWidth && finalWidth > options.maxWidth) {
    finalWidth = options.maxWidth;
    finalHeight = Math.round(finalWidth / targetAspectRatio);
  }

  // Use OffscreenCanvas if available, fallback to regular canvas
  if (hasModernCanvasSupport()) {
    const canvas = new OffscreenCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // High-quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw cropped image
    ctx.drawImage(
      imageBitmap,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      finalWidth,
      finalHeight
    );

    const croppedBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.95,
    });

    return {
      blob: croppedBlob,
      wasCropped: true,
      originalWidth,
      originalHeight,
      finalWidth,
      finalHeight,
    };
  } else {
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const canvas = document.createElement("canvas");
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // High-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw cropped image
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          finalWidth,
          finalHeight
        );

        canvas.toBlob(
          (croppedBlob) => {
            if (!croppedBlob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            resolve({
              blob: croppedBlob,
              wasCropped: true,
              originalWidth,
              originalHeight,
              finalWidth,
              finalHeight,
            });
          },
          "image/jpeg",
          0.95
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  }
}
