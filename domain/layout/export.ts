import { toPng } from "html-to-image";

/**
 * Waits for the next frame and idle time before proceeding.
 * More efficient than a fixed timeout.
 */
async function waitForRender(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      // Use requestIdleCallback if available, otherwise use a short timeout
      if ("requestIdleCallback" in window) {
        (window as typeof window & { requestIdleCallback: (cb: () => void) => void })
          .requestIdleCallback(() => resolve(), { timeout: 100 });
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

/**
 * Exports a DOM element to a PNG file.
 * @param elementId - The ID of the DOM element to export.
 * @param fileName - The name of the file to download.
 */
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
    // Wait for next frame and idle time to ensure rendering is complete
    await waitForRender();

    // Target a hi-DPI export, but don't upscale screenshots beyond their natural size.
    const desiredPixelRatio = pixelRatio ?? Math.max(window.devicePixelRatio || 1, 2);
    const maxScale = maxImageScale && Number.isFinite(maxImageScale) ? maxImageScale : Infinity;
    const resolvedPixelRatio = Math.min(Math.max(desiredPixelRatio, 1), Math.max(Math.min(3, maxScale), 1));

    // The visible preview is a scaled version of the hidden export surface.
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: resolvedPixelRatio,
      width,
      height,
      skipAutoScale: true,
      backgroundColor,
      // Ensure we capture styles correctly
      style: {
        visibility: "visible",
        zIndex: "auto",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      },
    });

    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
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
