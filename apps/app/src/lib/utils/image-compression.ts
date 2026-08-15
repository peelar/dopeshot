/**
 * Unified image compression utilities for dopeshot.
 * Compresses images to stay under Vercel's 4.5MB payload limit.
 */

export interface CompressionOptions {
  /** Maximum size in KB (default: 3500 for ~3.5MB) */
  maxSizeKB?: number;
  /** Initial JPEG quality (0-1, default: 0.92) */
  initialQuality?: number;
  /** Minimum JPEG quality before giving up (0-1, default: 0.6) */
  minQuality?: number;
  /** Quality reduction step (default: 0.1) */
  qualityStep?: number;
  /** Maximum width for resizing (optional, default: no resize) */
  maxWidth?: number;
}

export interface CompressedImage {
  blob: Blob;
  wasCompressed: boolean;
  originalSize: number;
  finalSize: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeKB: 3500,
  initialQuality: 0.92,
  minQuality: 0.6,
  qualityStep: 0.1,
  maxWidth: 0, // 0 means no max width
};

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
 * Fallback compression using regular canvas (for older browsers)
 */
async function compressWithRegularCanvas(
  blob: Blob,
  opts: Required<CompressionOptions>
): Promise<CompressedImage> {
  const originalSize = blob.size;
  const maxSizeBytes = opts.maxSizeKB * 1024;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Apply max width constraint if specified
      if (opts.maxWidth > 0 && width > opts.maxWidth) {
        height = Math.floor((height * opts.maxWidth) / width);
        width = opts.maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({
          blob,
          wasCompressed: false,
          originalSize,
          finalSize: blob.size,
        });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower quality
      let quality = opts.initialQuality;
      let bestBlob = blob;

      while (quality >= opts.minQuality) {
        const compressedBlob = await new Promise<Blob | null>((res) =>
          canvas.toBlob((b) => res(b), "image/jpeg", quality)
        );

        if (compressedBlob && compressedBlob.size <= maxSizeBytes) {
          resolve({
            blob: compressedBlob,
            wasCompressed: true,
            originalSize,
            finalSize: compressedBlob.size,
          });
          return;
        }

        if (compressedBlob) {
          bestBlob = compressedBlob;
        }

        quality -= opts.qualityStep;
      }

      // Return best attempt
      resolve({
        blob: bestBlob,
        wasCompressed: true,
        originalSize,
        finalSize: bestBlob.size,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        blob,
        wasCompressed: false,
        originalSize,
        finalSize: blob.size,
      });
    };

    img.src = url;
  });
}

/**
 * Compresses a Blob image to stay under the target size.
 * Uses progressive JPEG quality reduction and optional resizing.
 * Falls back to regular canvas for older browsers.
 */
export async function compressImageBlob(
  blob: Blob,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = blob.size;
  const maxSizeBytes = opts.maxSizeKB * 1024;

  // If already under limit, return as-is
  if (blob.size <= maxSizeBytes) {
    return {
      blob,
      wasCompressed: false,
      originalSize,
      finalSize: blob.size,
    };
  }

  // Use fallback for older browsers
  if (!hasModernCanvasSupport()) {
    return compressWithRegularCanvas(blob, opts);
  }

  // Convert blob to image for processing
  const imageBitmap = await createImageBitmap(blob);
  let { width, height } = imageBitmap;

  // Apply max width constraint if specified
  if (opts.maxWidth > 0 && width > opts.maxWidth) {
    height = Math.floor((height * opts.maxWidth) / width);
    width = opts.maxWidth;
  }

  // Create canvas for compression
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.warn("OffscreenCanvas context not available, using fallback");
    return compressWithRegularCanvas(blob, opts);
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Try progressively lower quality JPEG
  let quality = opts.initialQuality;
  let compressedBlob: Blob | null = null;

  while (quality >= opts.minQuality) {
    compressedBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });

    if (compressedBlob.size <= maxSizeBytes) {
      return {
        blob: compressedBlob,
        wasCompressed: true,
        originalSize,
        finalSize: compressedBlob.size,
      };
    }

    quality -= opts.qualityStep;
  }

  // If still too large after minimum quality, try aggressive resizing
  const scaleFactor = Math.sqrt(maxSizeBytes / (compressedBlob?.size || blob.size));
  const newWidth = Math.floor(width * Math.min(scaleFactor, 0.8));
  const newHeight = Math.floor(height * Math.min(scaleFactor, 0.8));

  const resizedCanvas = new OffscreenCanvas(newWidth, newHeight);
  const resizedCtx = resizedCanvas.getContext("2d");

  if (!resizedCtx) {
    // Return best attempt so far
    return {
      blob: compressedBlob || blob,
      wasCompressed: true,
      originalSize,
      finalSize: compressedBlob?.size || blob.size,
    };
  }

  // Use high-quality scaling
  resizedCtx.imageSmoothingEnabled = true;
  resizedCtx.imageSmoothingQuality = "high";
  resizedCtx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

  // Try compression on resized image
  quality = opts.initialQuality;
  while (quality >= opts.minQuality) {
    compressedBlob = await resizedCanvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });

    if (compressedBlob.size <= maxSizeBytes) {
      break;
    }

    quality -= opts.qualityStep;
  }

  return {
    blob: compressedBlob || blob,
    wasCompressed: true,
    originalSize,
    finalSize: compressedBlob?.size || blob.size,
  };
}

/**
 * Compresses a base64 data URL to stay under the target size.
 * Used for legacy code that works with data URLs instead of Blobs.
 * Converts to Blob internally, compresses, then converts back to data URL.
 */
export async function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Compress the blob
  const { blob: compressedBlob } = await compressImageBlob(blob, options);

  // Convert back to data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(compressedBlob);
  });
}
