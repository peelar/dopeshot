import { toPng } from "html-to-image";
import { EXPORT_ORIENTATION_DIMENSIONS } from "./screenshot-mode";
import type { Orientation } from "@/hooks/atoms";

/**
 * Waits for the next frame and idle time before proceeding.
 * More efficient than a fixed timeout.
 */
async function waitForRender(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      // Use requestIdleCallback if available, otherwise use a short timeout
      if ("requestIdleCallback" in window) {
        (
          window as typeof window & { requestIdleCallback: (cb: () => void) => void }
        ).requestIdleCallback(() => resolve(), { timeout: 100 });
      } else {
        setTimeout(resolve, 50);
      }
    });
  });

  // Ensure custom fonts are settled so text looks crisp in the export
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (error) {
      console.warn("Font loading wait skipped:", error);
    }
  }
}

type ExportSizeOptions = {
  width?: number;
  height?: number;
  backgroundColor?: string;
  pixelRatio?: number;
  /**
   * Upper bound for pixel ratio to avoid upscaling the embedded screenshot
   * beyond its natural resolution.
   */
  maxImageScale?: number;
};

function isSignedUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes("token=") ||
    url.includes("X-Amz-Signature=") ||
    url.includes("X-Amz-Algorithm=") ||
    url.includes("X-Amz-Credential=") ||
    url.includes("X-Amz-Date=")
  );
}

function elementHasSignedUrlImages(element: HTMLElement): boolean {
  const images = Array.from(element.querySelectorAll("img"));
  return images.some((img) => isSignedUrl(img.currentSrc || img.src));
}

/**
 * Calculate the pixel ratio for export, clamped to [1, 3].
 * Defaults to device pixel ratio or 2 (whichever is higher).
 * Respects maxImageScale to prevent upscaling beyond natural resolution.
 */
export function calculatePixelRatio(
  options: {
    desiredPixelRatio?: number;
    maxImageScale?: number;
    devicePixelRatio?: number;
  } = {},
): number {
  const {
    desiredPixelRatio,
    maxImageScale,
    devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1,
  } = options;

  const desired = desiredPixelRatio ?? Math.max(devicePixelRatio, 2);
  const maxScale = maxImageScale && Number.isFinite(maxImageScale) ? maxImageScale : Infinity;

  return Math.min(Math.max(desired, 1), Math.max(Math.min(3, maxScale), 1));
}

/**
 * Get export dimensions for a given orientation.
 */
export function getExportDimensions(orientation: Orientation) {
  return EXPORT_ORIENTATION_DIMENSIONS[orientation];
}

/**
 * Exports a DOM element to a PNG file.
 * @param elementId - The ID of the DOM element to export.
 * @param fileName - The name of the file to download.
 */
/**
 * Export layout and return both the data URL and blob
 * Used for memory persistence
 */
export async function exportLayoutAsPngWithBlob(
  elementId: string,
  {
    width = 1280,
    height = 720,
    backgroundColor = "white",
    pixelRatio,
    maxImageScale,
  }: ExportSizeOptions = {},
): Promise<{ dataUrl: string; blob: Blob }> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target with id "${elementId}" not found`);
  }

  try {
    await waitForRender();

    const hasSignedUrlImages = elementHasSignedUrlImages(element);
    const resolvedPixelRatio = calculatePixelRatio({
      desiredPixelRatio: pixelRatio,
      maxImageScale,
      devicePixelRatio: window.devicePixelRatio,
    });

    const dataUrl = await toPng(element, {
      // Signed URLs become invalid if we append cache-busting query params.
      cacheBust: !hasSignedUrlImages,
      pixelRatio: resolvedPixelRatio,
      width,
      height,
      skipAutoScale: true,
      backgroundColor,
      style: {
        visibility: "visible",
        zIndex: "auto",
        textRendering: "optimizeLegibility",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      } as Partial<CSSStyleDeclaration> & {
        WebkitFontSmoothing?: string;
        MozOsxFontSmoothing?: string;
      },
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return { dataUrl, blob };
  } catch (err) {
    console.error("Failed to export layout:", err);
    if (err instanceof Error) {
      throw err;
    } else if (typeof err === "object" && err !== null) {
      const msg = (err as any).message || (err as any).toString();
      throw new Error(`Export failed: ${msg}`);
    } else {
      throw new Error(`Export failed: ${String(err)}`);
    }
  }
}

export async function exportLayoutAsPng(
  elementId: string,
  fileName: string,
  {
    width = 1280,
    height = 720,
    backgroundColor = "white",
    pixelRatio,
    maxImageScale,
  }: ExportSizeOptions = {},
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target with id "${elementId}" not found`);
  }

  try {
    // Use the blob export function and download
    const { dataUrl: exportDataUrl } = await exportLayoutAsPngWithBlob(elementId, {
      width,
      height,
      backgroundColor,
      pixelRatio,
      maxImageScale,
    });

    const link = document.createElement("a");
    link.download = fileName;
    link.href = exportDataUrl;
    link.click();
  } catch (err) {
    console.error("Failed to export layout:", err);
    // Re-throw with more useful info if possible
    if (err instanceof Error) {
      throw err;
    } else if (typeof err === "object" && err !== null) {
      // Try to extract message from unknown objects (like DOMException)
      const msg = (err as any).message || (err as any).toString();
      throw new Error(`Export failed: ${msg}`);
    } else {
      throw new Error(`Export failed: ${String(err)}`);
    }
  }
}

/**
 * Generate a small thumbnail preview of the layout
 * Used for post-export success UI
 */
export async function generateThumbnail(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target with id "${elementId}" not found`);
  }

  try {
    await waitForRender();

    const hasSignedUrlImages = elementHasSignedUrlImages(element);
    // Capture full element at low resolution for thumbnail
    // CSS handles display sizing - we just need a lightweight capture
    const dataUrl = await toPng(element, {
      cacheBust: !hasSignedUrlImages,
      pixelRatio: 0.5, // Half resolution for smaller file size
      style: {
        visibility: "visible",
        zIndex: "auto",
      } as Partial<CSSStyleDeclaration>,
    });

    return dataUrl;
  } catch (err) {
    console.error("Failed to generate thumbnail:", err);
    throw new Error("Thumbnail generation failed");
  }
}
