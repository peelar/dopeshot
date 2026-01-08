/**
 * Image compression utilities for client-side file uploads.
 * Ensures uploaded images stay within size limits (5MB) while maintaining acceptable quality.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  compressionRatio: number;
  didCompress: boolean;
}

/**
 * Calculates the size of a base64 data URL in kilobytes.
 */
function getDataUrlSizeKB(dataUrl: string): number {
  // Base64 encoding increases size by ~33%, but data URLs have prefix overhead
  // More accurate: decode the base64 portion and measure actual bytes
  const base64 = dataUrl.split(",")[1] || "";
  const bytes = (base64.length * 3) / 4;
  return bytes / 1024;
}

/**
 * Compresses an image file to ensure it stays under the target size limit.
 * Uses a combination of dimension resizing and quality reduction.
 *
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in kilobytes (default: 5120 = 5MB)
 * @param maxWidth - Maximum width in pixels (default: 4096)
 * @param maxHeight - Maximum height in pixels (default: 4096)
 * @returns Promise resolving to compression result with data URL
 */
export async function compressImageFile(
  file: File,
  maxSizeKB: number = 5120, // 5MB default
  maxWidth: number = 4096,
  maxHeight: number = 4096
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Failed to read file"));
        return;
      }

      const originalSizeKB = getDataUrlSizeKB(dataUrl);

      // If already under limit and dimensions are reasonable, skip compression
      if (originalSizeKB <= maxSizeKB) {
        const img = new Image();
        img.onload = () => {
          if (img.width <= maxWidth && img.height <= maxHeight) {
            resolve({
              dataUrl,
              originalSizeKB,
              compressedSizeKB: originalSizeKB,
              compressionRatio: 1,
              didCompress: false,
            });
          } else {
            // Need to resize even though size is OK
            compressDataUrl(dataUrl, maxSizeKB, maxWidth, maxHeight, originalSizeKB)
              .then(resolve)
              .catch(reject);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = dataUrl;
        return;
      }

      // Need to compress
      compressDataUrl(dataUrl, maxSizeKB, maxWidth, maxHeight, originalSizeKB)
        .then(resolve)
        .catch(reject);
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses a data URL using canvas resizing and quality reduction.
 */
async function compressDataUrl(
  dataUrl: string,
  maxSizeKB: number,
  maxWidth: number,
  maxHeight: number,
  originalSizeKB: number
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      const aspectRatio = width / height;

      // Resize if dimensions exceed limits
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image at new dimensions with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format (preserve PNG for transparency, use JPEG for photos)
      const isPNG = dataUrl.startsWith("data:image/png");
      const outputFormat = isPNG ? "image/png" : "image/jpeg";

      // Try different quality levels to get under size limit
      let quality = 0.9;
      let compressedDataUrl = canvas.toDataURL(outputFormat, quality);
      let compressedSizeKB = getDataUrlSizeKB(compressedDataUrl);

      // Reduce quality until we're under the limit (minimum quality: 0.3)
      while (compressedSizeKB > maxSizeKB && quality > 0.3) {
        quality -= 0.1;
        compressedDataUrl = canvas.toDataURL(outputFormat, quality);
        compressedSizeKB = getDataUrlSizeKB(compressedDataUrl);
      }

      // If still over limit, try more aggressive resizing
      if (compressedSizeKB > maxSizeKB && quality <= 0.3) {
        // Reduce dimensions by 20% and retry
        width = Math.floor(width * 0.8);
        height = Math.floor(height * 0.8);
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        quality = 0.7;
        compressedDataUrl = canvas.toDataURL(outputFormat, quality);
        compressedSizeKB = getDataUrlSizeKB(compressedDataUrl);

        // Final quality reduction pass
        while (compressedSizeKB > maxSizeKB && quality > 0.3) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL(outputFormat, quality);
          compressedSizeKB = getDataUrlSizeKB(compressedDataUrl);
        }
      }

      resolve({
        dataUrl: compressedDataUrl,
        originalSizeKB,
        compressedSizeKB,
        compressionRatio: originalSizeKB / compressedSizeKB,
        didCompress: true,
      });
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = dataUrl;
  });
}

/**
 * Compresses an existing data URL (useful for screenshots or already-loaded images).
 */
export async function compressDataUrlString(
  dataUrl: string,
  maxSizeKB: number = 5120,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): Promise<CompressionResult> {
  const originalSizeKB = getDataUrlSizeKB(dataUrl);

  return compressDataUrl(dataUrl, maxSizeKB, maxWidth, maxHeight, originalSizeKB);
}
