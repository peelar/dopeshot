import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { createHash } from "node:crypto";

import { dataUrlToUint8Array } from "@/domain/asset/data-url";
import {
  generateGradientFromImage,
  type GradientPreferences,
  type GradientResult,
} from "@/domain/gradient-generation";

type GradientCacheEntry = {
  gradient: GradientResult;
  lastAccessed: number;
};

const gradientCache = new Map<string, GradientCacheEntry>();
const MAX_CACHE_ENTRIES = 24;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : undefined;
    const maxSize = typeof body?.maxSize === "number" ? body.maxSize : undefined;
    const debug = typeof body?.debug === "boolean" ? body.debug : process.env.NODE_ENV !== "production";
    const preferences = parsePreferences(body?.preferences);

    if (!imageDataUrl) {
      return NextResponse.json({ error: "Missing imageDataUrl" }, { status: 400 });
    }

    const bytes = dataUrlToUint8Array(imageDataUrl);
    if (!bytes) {
      return NextResponse.json({ error: "Unable to decode image data" }, { status: 400 });
    }

    const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const cacheKey = createHash("sha1").update(buffer).digest("hex");
    const cached = gradientCache.get(cacheKey);
    if (cached) {
      cached.lastAccessed = Date.now();
      return NextResponse.json({ gradient: cached.gradient, cached: true });
    }

    const gradient = await generateGradientFromImage(buffer, { maxSize, debug, preferences });
    storeGradientInCache(cacheKey, gradient);

    return NextResponse.json({ gradient, cached: false });
  } catch (error) {
    console.error("Gradient generation API error", error);
    return NextResponse.json({ error: "Failed to generate gradient" }, { status: 500 });
  }
}

function parsePreferences(raw: unknown): GradientPreferences | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const candidate = raw as Partial<GradientPreferences> & Record<string, unknown>;
  const preferences: GradientPreferences = {};

  if (typeof candidate.angle === "number") {
    preferences.angle = candidate.angle;
  }
  if (candidate.temperature === "warm" || candidate.temperature === "cool" || candidate.temperature === "neutral") {
    preferences.temperature = candidate.temperature;
  }
  if (candidate.intensity === "soft" || candidate.intensity === "balanced" || candidate.intensity === "bold") {
    preferences.intensity = candidate.intensity;
  }

  return Object.keys(preferences).length ? preferences : undefined;
}

function storeGradientInCache(key: string, gradient: GradientResult) {
  gradientCache.set(key, { gradient, lastAccessed: Date.now() });
  if (gradientCache.size > MAX_CACHE_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    for (const [entryKey, entry] of gradientCache) {
      if (entry.lastAccessed < oldestTimestamp) {
        oldestTimestamp = entry.lastAccessed;
        oldestKey = entryKey;
      }
    }
    if (oldestKey) {
      gradientCache.delete(oldestKey);
    }
  }
}
