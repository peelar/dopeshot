import { toPng } from "html-to-image";

/**
 * Exports a DOM element to a PNG file.
 * @param elementId - The ID of the DOM element to export.
 * @param fileName - The name of the file to download.
 */
export async function exportLayoutAsPng(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target with id "${elementId}" not found`);
  }

  try {
    // Wait a bit longer to ensure rendering and image decoding
    await new Promise((resolve) => setTimeout(resolve, 500));

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 1,
      width: 1200,
      height: 630,
      skipAutoScale: true,
      backgroundColor: "white",
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
