import { describe, expect, it } from "vitest";
import { buildShadowFromStyle, getShadowValue } from "@/components/layouts/shared/shadows";

function countShadowLayers(value: string): number {
  if (value === "none") return 0;

  let depth = 0;
  let count = 1;

  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) count += 1;
  }

  return count;
}

describe("shadows", () => {
  it("builds layered low/medium/high presets", () => {
    expect(countShadowLayers(getShadowValue("low"))).toBe(4);
    expect(countShadowLayers(getShadowValue("medium"))).toBe(5);
    expect(countShadowLayers(getShadowValue("high"))).toBe(5);
  });

  it("uses medium as the default preset", () => {
    expect(getShadowValue()).toBe(getShadowValue("medium"));
  });

  it("tints preset shadow colors using the provided surface color", () => {
    const warm = getShadowValue("medium", { surfaceColor: "#f97316" });
    const cool = getShadowValue("medium", { surfaceColor: "#22d3ee" });
    expect(warm).not.toBe(cool);
  });

  it("builds multi-layer personality shadows", () => {
    const value = buildShadowFromStyle({
      blur: 24,
      spread: -4,
      offsetY: 12,
      opacity: 0.18,
    });
    expect(countShadowLayers(value)).toBe(4);
  });

  it("adds a tint layer when personality tint is provided", () => {
    const tint = "rgba(139, 90, 43, 0.1)";
    const value = buildShadowFromStyle({
      blur: 24,
      spread: -4,
      offsetY: 12,
      opacity: 0.18,
      tint,
    });
    expect(countShadowLayers(value)).toBe(5);
    expect(value).toContain(tint);
  });

  it("returns none for zeroed personality shadow config", () => {
    const value = buildShadowFromStyle({
      blur: 0,
      spread: 0,
      offsetY: 0,
      opacity: 0,
    });
    expect(value).toBe("none");
  });
});
