/**
 * Server-side image compression using Sharp.
 * Ensures uploaded images stay within size limits while maintaining quality.
 */

import sharp from "sharp";

export interface ServerCompressionResult {
  buffer: Buffer;
  originalSizeKB: number;
  compressedSizeKB: number;
  compressionRatio: number;
  didCompress: boolean;
  format: string;
}

/**
 * Compresses an image buffer to ensure it stays under the target size limit.
 * Uses Sharp for high-quality server-side image processing.
 *
 * @param buffer - The image buffer to compress
 * @param maxSizeKB - Maximum size in kilobytes (default: 5120 = 5MB)
 * @param maxWidth - Maximum width in pixels (default: 4096)
 * @param maxHeight - Maximum height in pixels (default: 4096)
 * @returns Promise resolving to compression result
 */
export async function compressImageBuffer(
  buffer: Buffer,
  maxSizeKB: number = 5120, // 5MB default
  maxWidth: number = 4096,
  maxHeight: number = 4096
): Promise<ServerCompressionResult> {
  const originalSizeKB = buffer.length / 1024;

  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  const { width = 0, height = 0, format = "jpeg" } = metadata;

  // Check if image needs compression
  const needsResize = width > maxWidth || height > maxHeight;
  const needsCompress = originalSizeKB > maxSizeKB;

  if (!needsResize && !needsCompress) {
    // Image is already within limits
    return {
      buffer,
      originalSizeKB,
      compressedSizeKB: originalSizeKB,
      compressionRatio: 1,
      didCompress: false,
      format: format || "jpeg",
    };
  }

  // Calculate new dimensions maintaining aspect ratio
  let targetWidth = width;
  let targetHeight = height;

  if (needsResize) {
    const aspectRatio = width / height;
    if (width > height) {
      targetWidth = Math.min(width, maxWidth);
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else {
      targetHeight = Math.min(height, maxHeight);
      targetWidth = Math.round(targetHeight * aspectRatio);
    }
  }

  // Determine output format (preserve PNG for transparency, use JPEG for photos)
  const isPNG = format === "png";
  const hasAlpha = metadata.hasAlpha;
  const useFormat = isPNG || hasAlpha ? "png" : "jpeg";

  // Start with high quality
  let quality = 90;
  let compressedBuffer: Buffer;
  let compressedSizeKB: number;

  // Create Sharp pipeline with resize
  const pipeline = sharp(buffer).resize(targetWidth, targetHeight, {
    fit: "inside",
    withoutEnlargement: true,
  });

  // Apply format-specific compression
  if (useFormat === "png") {
    compressedBuffer = await pipeline
      .png({ quality, compressionLevel: 9 })
      .toBuffer();
  } else {
    compressedBuffer = await pipeline.jpeg({ quality }).toBuffer();
  }

  compressedSizeKB = compressedBuffer.length / 1024;

  // Reduce quality until we're under the limit
  while (compressedSizeKB > maxSizeKB && quality > 30) {
    quality -= 10;

    if (useFormat === "png") {
      compressedBuffer = await sharp(buffer)
        .resize(targetWidth, targetHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    } else {
      compressedBuffer = await sharp(buffer)
        .resize(targetWidth, targetHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();
    }

    compressedSizeKB = compressedBuffer.length / 1024;
  }

  // If still over limit, try more aggressive resizing
  if (compressedSizeKB > maxSizeKB) {
    targetWidth = Math.floor(targetWidth * 0.8);
    targetHeight = Math.floor(targetHeight * 0.8);
    quality = 70;

    if (useFormat === "png") {
      compressedBuffer = await sharp(buffer)
        .resize(targetWidth, targetHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    } else {
      compressedBuffer = await sharp(buffer)
        .resize(targetWidth, targetHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();
    }

    compressedSizeKB = compressedBuffer.length / 1024;
  }

  return {
    buffer: compressedBuffer,
    originalSizeKB,
    compressedSizeKB,
    compressionRatio: originalSizeKB / compressedSizeKB,
    didCompress: true,
    format: useFormat,
  };
}

/**
 * Checks if an image buffer exceeds the size limit.
 */
export function exceedsSizeLimit(buffer: Buffer, maxSizeKB: number = 5120): boolean {
  return buffer.length / 1024 > maxSizeKB;
}
