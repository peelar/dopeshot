import { describe, it, expect } from "vitest";
import { generateBlobs } from "@/app/playground/_lib/blob-overlay";
import type { BlobOverlayEffect } from "@/app/playground/_types";

const baseEffect: BlobOverlayEffect = {
  enabled: true,
  count: 2,
  strength: 0.4,
  softness: 0.7,
  scale: 0.6,
  blendMode: "screen",
  seed: 42,
  placement: "diagonal",
};

const palette = {
  dominant: "#101827",
  accent: "#60a5fa",
  muted: "#1f2937",
  vibrant: "#38bdf8",
};

describe("generateBlobs", () => {
  it("returns deterministic specs for seed", () => {
    const first = generateBlobs({
      seed: 42,
      count: 2,
      frameW: 800,
      frameH: 450,
      palette,
      params: baseEffect,
    });

    const second = generateBlobs({
      seed: 42,
      count: 2,
      frameW: 800,
      frameH: 450,
      palette,
      params: baseEffect,
    });

    expect(second.specs).toEqual(first.specs);
  });

  it("clamps blob count", () => {
    const result = generateBlobs({
      seed: 10,
      count: 5,
      frameW: 800,
      frameH: 450,
      palette,
      params: baseEffect,
    });

    expect(result.specs).toHaveLength(3);
  });
});
