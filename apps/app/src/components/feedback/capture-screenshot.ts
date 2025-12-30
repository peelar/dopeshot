import { toPng } from "html-to-image";

/**
 * Compresses a base64 image data URL by resizing if needed.
 * Ensures the image stays under Vercel's 4.5MB payload limit.
 */
async function compressImage(dataUrl: string, maxSizeKB: number = 2048): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Calculate new dimensions (max 1200px wide)
      const maxWidth = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to get under size limit
      let quality = 0.8;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Reduce quality until we're under the limit
      while (compressedDataUrl.length > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(compressedDataUrl);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Captures a screenshot of the canvas for feedback purposes.
 * Returns a base64 data URL of the screenshot, or null if capture fails.
 * Compresses the image to stay under Vercel's payload limits.
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

    // Compress to stay under Vercel's 4.5MB limit (target 2MB to be safe)
    const compressed = await compressImage(dataUrl, 2048);

    return compressed;
  } catch (error) {
    console.error("Failed to capture feedback screenshot:", error);
    return null;
  }
}
