/**
 * Tests for server-side image compression utilities.
 */

import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { compressImageBuffer, exceedsSizeLimit } from "@/lib/image-compression";

describe("compressImageBuffer", () => {
  it("should not compress small images under the limit", async () => {
    // Create a small test image (100x100 JPEG)
    const smallBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await compressImageBuffer(smallBuffer, 5120);

    expect(result.didCompress).toBe(false);
    expect(result.originalSizeKB).toBeLessThan(5120);
    expect(result.compressedSizeKB).toBe(result.originalSizeKB);
    expect(result.compressionRatio).toBe(1);
  });

  it("should compress large images over the limit", async () => {
    // Create a large test image (4000x4000 JPEG at high quality)
    const largeBuffer = await sharp({
      create: {
        width: 4000,
        height: 4000,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const result = await compressImageBuffer(largeBuffer, 1024); // 1MB limit

    expect(result.didCompress).toBe(true);
    expect(result.compressedSizeKB).toBeLessThanOrEqual(1024);
    expect(result.compressionRatio).toBeGreaterThan(1);
  });

  it("should resize images that exceed dimension limits", async () => {
    // Create an image larger than dimension limits
    const oversizedBuffer = await sharp({
      create: {
        width: 6000,
        height: 4000,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await compressImageBuffer(oversizedBuffer, 5120, 3000, 3000);

    expect(result.didCompress).toBe(true);

    // Check that dimensions were reduced
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBeLessThanOrEqual(3000);
    expect(metadata.height).toBeLessThanOrEqual(3000);
  });

  it("should preserve PNG format for images with transparency", async () => {
    // Create a PNG with alpha channel
    const pngBuffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const result = await compressImageBuffer(pngBuffer, 100); // Force compression

    expect(result.format).toBe("png");
  });

  it("should convert non-transparent images to JPEG", async () => {
    // Create a non-transparent PNG
    const pngBuffer = await sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    const result = await compressImageBuffer(pngBuffer, 100); // Force compression

    expect(result.format).toBe("jpeg");
  });

  it("should maintain aspect ratio during compression", async () => {
    // Create an image with 16:9 aspect ratio
    const buffer = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await compressImageBuffer(buffer, 100, 1280, 720); // Force resize

    const metadata = await sharp(result.buffer).metadata();
    const aspectRatio = (metadata.width || 0) / (metadata.height || 0);

    // Aspect ratio should be approximately 16:9 (1.777...)
    expect(aspectRatio).toBeCloseTo(1920 / 1080, 1);
  });

  it("should handle very large images with aggressive compression", async () => {
    // Create a very large image
    const veryLargeBuffer = await sharp({
      create: {
        width: 5000,
        height: 5000,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const result = await compressImageBuffer(veryLargeBuffer, 500); // Very strict limit

    expect(result.didCompress).toBe(true);
    expect(result.compressedSizeKB).toBeLessThanOrEqual(500);
  });
});

describe("exceedsSizeLimit", () => {
  it("should return true for buffers exceeding the limit", async () => {
    const largeBuffer = await sharp({
      create: {
        width: 3000,
        height: 3000,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    expect(exceedsSizeLimit(largeBuffer, 500)).toBe(true);
  });

  it("should return false for buffers under the limit", async () => {
    const smallBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    expect(exceedsSizeLimit(smallBuffer, 5120)).toBe(false);
  });

  it("should use default 5MB limit when not specified", async () => {
    const buffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    expect(exceedsSizeLimit(buffer)).toBe(false);
  });
});
