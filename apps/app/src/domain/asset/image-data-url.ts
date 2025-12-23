export async function getImageDataUrl(src: string): Promise<string | null> {
  if (!src || typeof src !== "string") {
    return null;
  }

  if (src.startsWith("data:")) {
    return src;
  }

  try {
    const response = await fetch(src);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image data URL"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Failed to load image data URL", error);
    return null;
  }
}
