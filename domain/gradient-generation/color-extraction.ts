import { Buffer } from "buffer";
import sharp from "sharp";
import chroma from "chroma-js";

export interface ExtractionOptions {
  maxSize?: number;
  sampleStep?: number;
  focusArea?: number; // percentage of frame (0-1) to analyze in center
  saturationWeight?: number;
  debug?: boolean;
}

export interface ClassifiedColor {
  hex: string;
  population: number; // relative weight (0-1)
  saturation: number;
  lightness: number;
  lab: [number, number, number];
  isAccent: boolean;
}

export interface ColorExtractionResult {
  accentColors: ClassifiedColor[];
  baseColors: ClassifiedColor[];
  colors: ClassifiedColor[];
  stats: {
    totalSamples: number;
    usedSamples: number;
    clusterCount: number;
    focusDimensions: {
      width: number;
      height: number;
    };
  };
  debug?: {
    clusters: Array<{
      center: [number, number, number];
      population: number;
    }>;
  };
}

interface SampledPixel {
  lab: [number, number, number];
  saturation: number;
  lightness: number;
  weight: number;
  hex: string;
}

const DEFAULT_MAX_SIZE = 800;
const DEFAULT_SAMPLE_STEP = 4;
const DEFAULT_FOCUS = 0.7;
const MAX_CLUSTERS = 6;
const MIN_CLUSTER_DISTANCE = 8; // in LAB space

export async function extractPaletteFromImage(
  imageBuffer: Buffer,
  options?: ExtractionOptions,
): Promise<ColorExtractionResult> {
  if (!imageBuffer || imageBuffer.byteLength === 0) {
    throw new Error("Image buffer is empty");
  }

  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;
  const sampleStep = Math.max(1, Math.round(options?.sampleStep ?? DEFAULT_SAMPLE_STEP));
  const focusRatio = Math.min(0.95, Math.max(0.4, options?.focusArea ?? DEFAULT_FOCUS));

  const baseImage = sharp(imageBuffer).rotate();
  const metadata = await baseImage.metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  if (!originalWidth || !originalHeight) {
    throw new Error("Unable to read image dimensions");
  }

  const largestSide = Math.max(originalWidth, originalHeight);
  const resizeFactor = largestSide > maxSize ? maxSize / largestSide : 1;
  const targetWidth = Math.max(1, Math.round(originalWidth * resizeFactor));
  const targetHeight = Math.max(1, Math.round(originalHeight * resizeFactor));

  const focusWidth = Math.max(1, Math.round(targetWidth * focusRatio));
  const focusHeight = Math.max(1, Math.round(targetHeight * focusRatio));
  const focusLeft = Math.max(0, Math.round((targetWidth - focusWidth) / 2));
  const focusTop = Math.max(0, Math.round((targetHeight - focusHeight) / 2));

  const processed = baseImage
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .extract({ left: focusLeft, top: focusTop, width: focusWidth, height: focusHeight });

  const { data, info } = await processed
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let effectiveSampleStep = sampleStep;
  const focusArea = focusWidth * focusHeight;
  if (focusArea <= 160 * 160) {
    effectiveSampleStep = 1;
  } else if (focusArea <= 320 * 320) {
    effectiveSampleStep = Math.min(effectiveSampleStep, 2);
  }

  const samples = samplePixels(data, info.width, info.height, info.channels, effectiveSampleStep);
  let candidatePixels = filterPixels(samples);

  if (!candidatePixels.length) {
    candidatePixels = samples.filter((pixel) => pixel.lightness > 0.05 && pixel.lightness < 0.95);
  }

  if (!candidatePixels.length) {
    candidatePixels = samples.slice(0, Math.min(1000, samples.length));
  }

  if (!candidatePixels.length) {
    throw new Error("No valid pixels available after filtering");
  }

  const clusterCount = Math.max(3, Math.min(MAX_CLUSTERS, Math.round(candidatePixels.length / 500)));
  const clusters = runKMeans(candidatePixels, clusterCount);
  const classified = classifyClusters(clusters, candidatePixels, options?.saturationWeight ?? 0.65);

  const accentColors = classified.filter((color) => color.isAccent);
  const baseColors = classified.filter((color) => !color.isAccent);

  return {
    accentColors,
    baseColors,
    colors: classified,
    stats: {
      totalSamples: samples.length,
      usedSamples: candidatePixels.length,
      clusterCount: classified.length,
      focusDimensions: {
        width: focusWidth,
        height: focusHeight,
      },
    },
    debug: options?.debug
      ? {
          clusters: clusters.map((cluster) => ({
            center: cluster.center,
            population: cluster.population,
          })),
        }
      : undefined,
  };
}

function samplePixels(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  step: number,
): SampledPixel[] {
  const pixels: SampledPixel[] = [];
  const hasAlpha = channels === 4;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * channels;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const alpha = hasAlpha ? data[index + 3] / 255 : 1;

      if (alpha < 0.2) continue;

      const color = chroma(r, g, b);
      const [_, s, l] = color.hsl();
      if (Number.isNaN(s) || Number.isNaN(l)) {
        continue;
      }

      const lab = color.lab() as [number, number, number];
      const weight = alpha * (0.4 + s);

      pixels.push({
        lab,
        saturation: s,
        lightness: l,
        weight,
        hex: color.hex(),
      });
    }
  }

  return pixels;
}

function filterPixels(pixels: SampledPixel[]): SampledPixel[] {
  return pixels.filter((pixel) => {
    const { saturation, lightness } = pixel;
    const isNearBlack = lightness < 0.06;
    const isNearWhite = lightness > 0.9;
    const isGray = saturation < 0.15;

    return !isNearBlack && !isNearWhite && !isGray;
  });
}

type Cluster = {
  center: [number, number, number];
  population: number;
  members: number[];
};

function runKMeans(pixels: SampledPixel[], k: number, iterations = 12): Cluster[] {
  const centers = initializeCenters(pixels, k);
  const assignments = new Array<number>(pixels.length).fill(-1);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let changed = false;

    // assignment step
    for (let i = 0; i < pixels.length; i += 1) {
      const pixel = pixels[i];
      let closest = 0;
      let closestDist = Infinity;
      for (let c = 0; c < centers.length; c += 1) {
        const dist = labDistance(pixel.lab, centers[c]);
        if (dist < closestDist) {
          closestDist = dist;
          closest = c;
        }
      }
      if (assignments[i] !== closest) {
        assignments[i] = closest;
        changed = true;
      }
    }

    if (!changed && iteration > 0) {
      break;
    }

    // update step
    for (let c = 0; c < centers.length; c += 1) {
      let sumL = 0;
      let sumA = 0;
      let sumB = 0;
      let weightTotal = 0;
      for (let i = 0; i < pixels.length; i += 1) {
        if (assignments[i] !== c) continue;
        const pixel = pixels[i];
        sumL += pixel.lab[0] * pixel.weight;
        sumA += pixel.lab[1] * pixel.weight;
        sumB += pixel.lab[2] * pixel.weight;
        weightTotal += pixel.weight;
      }
      if (weightTotal > 0) {
        centers[c] = [sumL / weightTotal, sumA / weightTotal, sumB / weightTotal];
      }
    }
  }

  const clusters: Cluster[] = centers.map((center, index) => ({
    center,
    population: 0,
    members: [],
  }));

  for (let i = 0; i < assignments.length; i += 1) {
    const clusterIndex = assignments[i];
    if (clusterIndex === -1) continue;
    clusters[clusterIndex].population += pixels[i].weight;
    clusters[clusterIndex].members.push(i);
  }

  return clusters.filter((cluster) => cluster.population > 0);
}

function initializeCenters(pixels: SampledPixel[], k: number): [number, number, number][] {
  const sorted = [...pixels].sort((a, b) => b.weight - a.weight);
  const centers: [number, number, number][] = [];

  for (const pixel of sorted) {
    if (centers.length === 0) {
      centers.push(pixel.lab.slice() as [number, number, number]);
      continue;
    }

    const minDistance = centers.reduce((distance, center) => {
      return Math.min(distance, labDistance(center, pixel.lab));
    }, Infinity);

    if (minDistance > MIN_CLUSTER_DISTANCE - centers.length) {
      centers.push(pixel.lab.slice() as [number, number, number]);
    }

    if (centers.length >= k) {
      break;
    }
  }

  while (centers.length < k && centers.length < sorted.length) {
    const fallback = sorted[centers.length % sorted.length];
    centers.push(fallback.lab.slice() as [number, number, number]);
  }

  return centers;
}

function classifyClusters(
  clusters: Cluster[],
  pixels: SampledPixel[],
  saturationWeight: number,
): ClassifiedColor[] {
  const totalPopulation = clusters.reduce((sum, cluster) => sum + cluster.population, 0) || 1;

  const classified = clusters
    .map((cluster) => {
      let satSum = 0;
      let lightSum = 0;
      let members = 0;

      for (const memberIndex of cluster.members) {
        const pixel = pixels[memberIndex];
        satSum += pixel.saturation * pixel.weight;
        lightSum += pixel.lightness * pixel.weight;
        members += pixel.weight;
      }

      const avgSaturation = members ? satSum / members : 0;
      const avgLightness = members ? lightSum / members : 0;
      const color = chroma.lab(cluster.center[0], cluster.center[1], cluster.center[2]);
      const hex = color.hex();

      const saturationScore = avgSaturation * saturationWeight;
      const balanceScore = 1 - Math.abs(avgLightness - 0.5);
      const accentScore = saturationScore * 0.7 + balanceScore * 0.3;
      const isAccent = accentScore > 0.45 && avgSaturation > 0.35;

      return {
        hex,
        population: cluster.population / totalPopulation,
        saturation: avgSaturation,
        lightness: avgLightness,
        lab: cluster.center,
        isAccent,
      } satisfies ClassifiedColor;
    })
    .sort((a, b) => b.population - a.population);

  // Ensure at least one accent color
  if (!classified.some((color) => color.isAccent)) {
    const candidate = classified.reduce((prev, current) =>
      current.saturation > prev.saturation ? current : prev,
    );
    candidate.isAccent = true;
  }

  return classified;
}

function labDistance(a: [number, number, number], b: [number, number, number]): number {
  const dL = a[0] - b[0];
  const dA = a[1] - b[1];
  const dB = a[2] - b[2];
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}
