import { toPng } from "html-to-image";

/**
 * Captures a screenshot of the canvas for feedback purposes.
 * Returns a base64 data URL of the screenshot, or null if capture fails.
 *
 * @param elementId - The ID of the element to capture (typically "export-container")
 * @returns Promise resolving to data URL or null
 */
export async function captureFeedbackScreenshot(
  elementId: string = "export-container"
): Promise<string | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Screenshot element with id "${elementId}" not found`);
      return null;
    }

    // Wait for fonts to load for crisp text
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (error) {
        console.warn("Font loading wait skipped:", error);
      }
    }

    // Capture at reasonable resolution for email (smaller than export)
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 1.5, // Lower than export (which uses 2-3x)
      skipAutoScale: true,
      // Use element's actual dimensions (no forced width/height)
      style: {
        visibility: "visible",
        textRendering: "optimizeLegibility",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      } as Partial<CSSStyleDeclaration> & {
        WebkitFontSmoothing?: string;
        MozOsxFontSmoothing?: string;
      },
    });

    return dataUrl;
  } catch (error) {
    console.error("Failed to capture feedback screenshot:", error);
    return null;
  }
}
