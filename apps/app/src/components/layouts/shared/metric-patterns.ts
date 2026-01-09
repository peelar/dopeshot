type MetricPatternSvgOptions = {
  seed: number;
  width: number;
  height: number;
  primaryColor: string;
  stepPx?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseMetricSeed(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 1337;
}

export function normalizeCssRgbForSvg(color: string): string {
  const match = color.match(/rgb\\(\\s*(\\d+)\\s*[ ,]\\s*(\\d+)\\s*[ ,]\\s*(\\d+)\\s*\\)/i);
  if (!match) return color;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  return `rgb(${r},${g},${b})`;
}

function createSparklinePoints({
  seed,
  width,
  height,
  stepPx,
}: {
  seed: number;
  width: number;
  height: number;
  stepPx: number;
}): string {
  const rand = mulberry32(seed + width * 31 + height * 17);

  const minY = Math.round(height * 0.24);
  const maxY = Math.round(height * 0.78);
  let currentY = Math.round(height * 0.56);

  const pointCount = Math.ceil(width / stepPx) + 1;
  const points: string[] = [];

  for (let i = 0; i < pointCount; i += 1) {
    const x = i * stepPx;
    if (i > 0) {
      const delta = Math.round((rand() * 2 - 1) * 14);
      currentY = clamp(currentY + delta, minY, maxY);
    }
    points.push(`${x},${currentY}`);
  }

  return points.join(" ");
}

export function createMetricPatternSvgDataUrl({
  seed,
  width,
  height,
  primaryColor,
  stepPx = 20,
}: MetricPatternSvgOptions): string {
  const safePrimary = normalizeCssRgbForSvg(primaryColor);
  const points = createSparklinePoints({ seed, width, height, stepPx });

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
  <defs>
    <pattern id="grid" width="${stepPx}" height="${stepPx}" patternUnits="userSpaceOnUse">
      <path d="M ${stepPx} 0 L 0 0 0 ${stepPx}" fill="none" stroke="${safePrimary}" stroke-width="1" opacity="0.22" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
  <polyline points="${points}" fill="none" stroke="${safePrimary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
</svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const METRIC_PATTERN_MASK =
  "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 34%, rgba(0,0,0,0) 74%)";

