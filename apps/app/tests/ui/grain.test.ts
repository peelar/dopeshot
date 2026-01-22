import { describe, it, expect } from "vitest";
import { buildGrainStyles } from "@/app/playground/_lib/grain";
import type { GrainEffect } from "@/app/playground/_types";

const baseEffect: GrainEffect = {
  enabled: true,
  amount: 0.2,
  scale: 0.5,
  blendMode: "soft-light",
  useSeed: true,
  seed: 12,
};

describe("buildGrainStyles", () => {
  it("maps amount to subtle opacity", () => {
    const result = buildGrainStyles({ ...baseEffect, amount: 1 });
    expect(result.meta.opacity).toBeCloseTo(0.35, 4);
  });

  it("maps scale to base frequency", () => {
    const low = buildGrainStyles({ ...baseEffect, scale: 0 });
    const high = buildGrainStyles({ ...baseEffect, scale: 1 });

    expect(low.meta.baseFrequency).toBe("0.900 0.900");
    expect(high.meta.baseFrequency).toBe("0.250 0.250");
  });

  it("drops seed when disabled", () => {
    const result = buildGrainStyles({ ...baseEffect, useSeed: false });
    expect(result.meta.seed).toBeUndefined();
  });
});
