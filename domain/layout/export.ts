import { toPng } from "html-to-image";

/**
 * Waits for the next frame and idle time before proceeding.
 * More efficient than a fixed timeout.
 */
function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
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
}

type ExportSizeOptions = {
  width?: number;
  height?: number;
  backgroundColor?: string;
};

/**
 * Exports a DOM element to a PNG file.
 * @param elementId - The ID of the DOM element to export.
 * @param fileName - The name of the file to download.
 */
export async function exportLayoutAsPng(
  elementId: string,
  fileName: string,
  { width = 1280, height = 720, backgroundColor = "white" }: ExportSizeOptions = {},
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target with id "${elementId}" not found`);
  }

  try {
    // Wait for next frame and idle time to ensure rendering is complete
    await waitForRender();

    // The visible preview is a scaled version of the hidden export surface.
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 1,
      width,
      height,
      skipAutoScale: true,
      backgroundColor,
      // Ensure we capture styles correctly
      style: {
        visibility: "visible",
        zIndex: "auto",
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
