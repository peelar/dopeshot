import { Buffer } from "buffer";
import chroma from "chroma-js";

export type SupportedImageBuffer = Buffer | ArrayBuffer | ArrayBufferView;

export function normalizeImageBuffer(imageBuffer: SupportedImageBuffer): Buffer {
  if (Buffer.isBuffer(imageBuffer)) {
    return imageBuffer;
  }

  if (imageBuffer instanceof ArrayBuffer) {
    return Buffer.from(imageBuffer);
  }

  if (ArrayBuffer.isView(imageBuffer)) {
    return Buffer.from(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength);
  }

  throw new Error(
    "Unsupported image buffer type. Expected Buffer, ArrayBuffer, or ArrayBufferView.",
  );
}

export function isLikelyImageBuffer(buffer: Buffer): boolean {
  if (buffer.byteLength < 4) {
    return false;
  }

  const isPng =
    buffer.byteLength >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[buffer.byteLength - 2] === 0xff &&
    buffer[buffer.byteLength - 1] === 0xd9;

  const header = buffer.subarray(0, 6).toString("ascii");
  const isGif = header === "GIF87a" || header === "GIF89a";

  return isPng || isJpeg || isGif;
}

export function labDistance(first: string, second: string): number {
  const [l1, a1, b1] = chroma(first).lab();
  const [l2, a2, b2] = chroma(second).lab();
  const dL = l1 - l2;
  const dA = a1 - a2;
  const dB = b1 - b2;
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}








