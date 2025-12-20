import sharp, { type Color } from "sharp";

type Overlay = {
  color: Color | string;
  width: number;
  height?: number;
  left?: number;
  top?: number;
};

type CreateImageOptions = {
  width: number;
  height: number;
  background: Color | string;
  overlays?: Overlay[];
};

export async function createTestImage({
  width,
  height,
  background,
  overlays = [],
}: CreateImageOptions): Promise<Buffer> {
  const base = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background,
    },
  })
    .png()
    .toBuffer();

  if (!overlays.length) {
    return base;
  }

  const composites = await Promise.all(
    overlays.map(async (overlay) => {
      const overlayWidth = clampDimension(overlay.width, width);
      const overlayHeight = clampDimension(overlay.height ?? height, height);
      const input = await sharp({
        create: {
          width: overlayWidth,
          height: overlayHeight,
          channels: 3,
          background: overlay.color,
        },
      })
        .png()
        .toBuffer();

      return {
        input,
        left: clampPosition(overlay.left ?? 0, width - overlayWidth),
        top: clampPosition(overlay.top ?? 0, height - overlayHeight),
      };
    }),
  );

  return sharp(base)
    .composite(composites)
    .png()
    .toBuffer();
}

function clampDimension(value: number, limit: number): number {
  const safe = Math.max(1, Math.round(value));
  return Math.min(limit, safe);
}

function clampPosition(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  const safe = Math.round(value);
  return Math.min(max, Math.max(0, safe));
}
