/**
 * Compresses a Blob image to stay under a target size.
 * Used for design saves to avoid Vercel's 4.5MB payload limit.
 *
 * Strategy:
 * 1. Start with high-quality PNG
 * 2. If too large, convert to JPEG and reduce quality progressively
 * 3. If still too large, resize the image
 */

const MAX_PAYLOAD_SIZE_KB = 3500; // Target 3.5MB to leave room for JSON config
const INITIAL_QUALITY = 0.92;
const MIN_QUALITY = 0.6;
const QUALITY_STEP = 0.1;

export interface CompressedImage {
  blob: Blob;
  wasCompressed: boolean;
  originalSize: number;
  finalSize: number;
}

/**
 * Compresses a blob image to stay under the payload limit.
 * Returns the compressed blob along with compression metadata.
 */
export async function compressImageBlob(
  blob: Blob,
  maxSizeKB: number = MAX_PAYLOAD_SIZE_KB
): Promise<CompressedImage> {
  const originalSize = blob.size;
  const maxSizeBytes = maxSizeKB * 1024;

  // If already under limit, return as-is
  if (blob.size <= maxSizeBytes) {
    return {
      blob,
      wasCompressed: false,
      originalSize,
      finalSize: blob.size,
    };
  }

  // Convert blob to image for processing
  const imageBitmap = await createImageBitmap(blob);
  const { width, height } = imageBitmap;

  // Create canvas for compression
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    // Fallback - return original if canvas not supported
    console.warn("OffscreenCanvas not supported, returning original image");
    return {
      blob,
      wasCompressed: false,
      originalSize,
      finalSize: blob.size,
    };
  }

  ctx.drawImage(imageBitmap, 0, 0);

  // Try progressively lower quality JPEG
  let quality = INITIAL_QUALITY;
  let compressedBlob: Blob | null = null;

  while (quality >= MIN_QUALITY) {
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

    quality -= QUALITY_STEP;
  }

  // If still too large, resize the image
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
  quality = INITIAL_QUALITY;
  while (quality >= MIN_QUALITY) {
    compressedBlob = await resizedCanvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });

    if (compressedBlob.size <= maxSizeBytes) {
      break;
    }

    quality -= QUALITY_STEP;
  }

  return {
    blob: compressedBlob || blob,
    wasCompressed: true,
    originalSize,
    finalSize: compressedBlob?.size || blob.size,
  };
}
