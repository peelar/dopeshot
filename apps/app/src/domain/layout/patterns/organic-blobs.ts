type Point = { x: number; y: number };

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function distortedCirclePoints(options: {
  seed: string;
  pointCount: number;
  center: Point;
  radius: number;
  distortion: number;
}): Point[] {
  const { seed, pointCount, center, radius, distortion } = options;
  const random = mulberry32(fnv1a(seed));

  const points: Point[] = [];
  for (let i = 0; i < pointCount; i += 1) {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / pointCount;
    const jitter = (random() * 2 - 1) * distortion; // [-distortion, +distortion]
    const r = radius * (1 + jitter);
    points.push({
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r,
    });
  }

  return points;
}

function catmullRomClosedToBezierPath(points: Point[], tension = 1): string {
  if (points.length < 2) return "";

  const safeTension = clamp(tension, 0, 2);
  const n = points.length;

  const first = points[0]!;
  let d = `M ${round(first.x)} ${round(first.y)}`;

  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;

    const cp1: Point = {
      x: p1.x + ((p2.x - p0.x) * safeTension) / 6,
      y: p1.y + ((p2.y - p0.y) * safeTension) / 6,
    };
    const cp2: Point = {
      x: p2.x - ((p3.x - p1.x) * safeTension) / 6,
      y: p2.y - ((p3.y - p1.y) * safeTension) / 6,
    };

    d += ` C ${round(cp1.x)} ${round(cp1.y)} ${round(cp2.x)} ${round(cp2.y)} ${round(p2.x)} ${round(p2.y)}`;
  }

  return `${d} Z`;
}

export function generateOrganicBlobPath(options: {
  seed: string;
  center: Point;
  radius: number;
  distortion?: number;
  pointCount?: number;
  tension?: number;
}): string {
  const { seed, center, radius } = options;
  const distortion = options.distortion ?? 0.2;
  const pointCount = options.pointCount ?? 6;
  const tension = options.tension ?? 1;

  const points = distortedCirclePoints({
    seed,
    pointCount,
    center,
    radius,
    distortion,
  });

  return catmullRomClosedToBezierPath(points, tension);
}

function svgToDataUrl(svg: string) {
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%2F/g, "/");
  return `data:image/svg+xml,${encoded}`;
}

export function createOrganicBlobsPreviewDataUrl(options: {
  seed: string;
  primary: string;
  secondary: string;
}): string {
  const { seed, primary, secondary } = options;

  const blobASeed = `${seed}:a`;
  const blobBSeed = `${seed}:b`;

  const blobA = generateOrganicBlobPath({
    seed: blobASeed,
    center: { x: 78, y: 24 },
    radius: 30,
    distortion: 0.22,
  });

  const blobB = generateOrganicBlobPath({
    seed: blobBSeed,
    center: { x: 22, y: 78 },
    radius: 32,
    distortion: 0.24,
  });

  const blobBTransform = `translate(22 78) rotate(45) scale(0.92) translate(-22 -78)`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <path d="${blobA}" fill="${primary}" opacity="0.10"/>
  <path d="${blobB}" fill="${secondary}" opacity="0.20" transform="${blobBTransform}"/>
</svg>`;

  return svgToDataUrl(svg);
}

