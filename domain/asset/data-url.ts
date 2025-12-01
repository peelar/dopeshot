import { Buffer } from "buffer";

export function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  if (!dataUrl || typeof dataUrl !== "string") {
    return null;
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return null;
  }

  const base64Data = dataUrl.slice(commaIndex + 1);

  try {
    if (typeof atob === "function") {
      const binaryString = atob(base64Data);
      const length = binaryString.length;
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  } catch (error) {
    console.warn("Failed to decode base64 data URL via atob", error);
  }

  try {
    const buffer = Buffer.from(base64Data, "base64");
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } catch (error) {
    console.error("Failed to decode base64 data URL via Buffer", error);
    return null;
  }
}
