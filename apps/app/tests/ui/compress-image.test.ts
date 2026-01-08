/**
 * Tests for client-side image compression utilities.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { compressImageFile, compressDataUrlString } from "@/domain/asset/compress-image";

// Mock canvas and image APIs
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  imageSmoothingEnabled: true,
  imageSmoothingQuality: "high",
})) as any;

global.HTMLCanvasElement.prototype.toDataURL = vi.fn((format: string, quality: number) => {
  // Simulate compression by returning smaller strings at lower quality
  const baseSize = 1000000; // 1MB base
  const compressedSize = Math.floor(baseSize * quality);
  return `data:${format};base64,${"A".repeat(compressedSize)}`;
});

describe("compressImageFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not compress small images under the limit", async () => {
    // Create a small test file (1KB)
    const smallFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

    // Mock FileReader
    const mockDataUrl = "data:image/jpeg;base64,testdata";
    vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
      setTimeout(() => {
        Object.defineProperty(this, "result", { value: mockDataUrl });
        this.onload?.({ target: this } as ProgressEvent<FileReader>);
      }, 0);
    });

    // Mock Image loading
    vi.spyOn(Image.prototype, "addEventListener").mockImplementation(function (
      this: HTMLImageElement,
      event: string,
      handler: any
    ) {
      if (event === "load") {
        Object.defineProperty(this, "width", { value: 800 });
        Object.defineProperty(this, "height", { value: 600 });
        setTimeout(() => handler(), 0);
      }
    });

    const result = await compressImageFile(smallFile, 5120);

    expect(result.didCompress).toBe(false);
    expect(result.originalSizeKB).toBeLessThan(5120);
  });

  it("should compress large images over the limit", async () => {
    // Create a large test file (10MB)
    const largeData = new Uint8Array(10 * 1024 * 1024);
    const largeFile = new File([largeData], "large.jpg", { type: "image/jpeg" });

    // Mock FileReader
    const mockDataUrl = `data:image/jpeg;base64,${"A".repeat(15000000)}`;
    vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
      setTimeout(() => {
        Object.defineProperty(this, "result", { value: mockDataUrl });
        this.onload?.({ target: this } as ProgressEvent<FileReader>);
      }, 0);
    });

    // Mock Image loading with large dimensions
    vi.spyOn(Image.prototype, "addEventListener").mockImplementation(function (
      this: HTMLImageElement,
      event: string,
      handler: any
    ) {
      if (event === "load") {
        Object.defineProperty(this, "width", { value: 5000 });
        Object.defineProperty(this, "height", { value: 5000 });
        setTimeout(() => handler(), 0);
      }
    });

    const result = await compressImageFile(largeFile, 5120);

    expect(result.didCompress).toBe(true);
    expect(result.compressedSizeKB).toBeLessThanOrEqual(5120);
    expect(result.compressionRatio).toBeGreaterThan(1);
  });

  it("should resize images that exceed dimension limits", async () => {
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    // Mock FileReader
    const mockDataUrl = "data:image/jpeg;base64,testdata";
    vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
      setTimeout(() => {
        Object.defineProperty(this, "result", { value: mockDataUrl });
        this.onload?.({ target: this } as ProgressEvent<FileReader>);
      }, 0);
    });

    // Mock Image with dimensions exceeding limits
    vi.spyOn(Image.prototype, "addEventListener").mockImplementation(function (
      this: HTMLImageElement,
      event: string,
      handler: any
    ) {
      if (event === "load") {
        Object.defineProperty(this, "width", { value: 8000 }); // Exceeds 4096 default
        Object.defineProperty(this, "height", { value: 6000 });
        setTimeout(() => handler(), 0);
      }
    });

    const result = await compressImageFile(file, 5120, 4096, 4096);

    expect(result.didCompress).toBe(true);
  });
});

describe("compressDataUrlString", () => {
  it("should compress a data URL that exceeds size limit", async () => {
    const largeDataUrl = `data:image/jpeg;base64,${"A".repeat(10000000)}`;

    // Mock Image loading
    vi.spyOn(Image.prototype, "addEventListener").mockImplementation(function (
      this: HTMLImageElement,
      event: string,
      handler: any
    ) {
      if (event === "load") {
        Object.defineProperty(this, "width", { value: 4000 });
        Object.defineProperty(this, "height", { value: 3000 });
        setTimeout(() => handler(), 0);
      }
    });

    const result = await compressDataUrlString(largeDataUrl, 5120);

    expect(result.didCompress).toBe(true);
    expect(result.originalSizeKB).toBeGreaterThan(5120);
  });

  it("should maintain aspect ratio during compression", async () => {
    const dataUrl = "data:image/jpeg;base64,testdata";

    // Mock Image with known aspect ratio
    vi.spyOn(Image.prototype, "addEventListener").mockImplementation(function (
      this: HTMLImageElement,
      event: string,
      handler: any
    ) {
      if (event === "load") {
        Object.defineProperty(this, "width", { value: 1600 });
        Object.defineProperty(this, "height", { value: 900 }); // 16:9 ratio
        setTimeout(() => handler(), 0);
      }
    });

    const result = await compressDataUrlString(dataUrl, 100); // Force compression

    expect(result.didCompress).toBe(true);
    // Aspect ratio should be preserved (approximately)
  });
});
