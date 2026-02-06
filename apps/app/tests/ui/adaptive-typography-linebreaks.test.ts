import { describe, it, expect } from "vitest";
import { getAdaptiveTypography } from "@/domain/layout/adaptive-typography";

function readRem(value: string | number | undefined): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value !== "string") {
    return 0;
  }
  return Number.parseFloat(value.replace("rem", ""));
}

describe("adaptive typography line break scaling", () => {
  it("shrinks title size when explicit line breaks are present", () => {
    const base = getAdaptiveTypography(
      "founder",
      "var(--font-clean)",
      "dopeshot completely transformed how I ship. Right now, no feature goes unshared.",
      "",
    );
    const withBreak = getAdaptiveTypography(
      "founder",
      "var(--font-clean)",
      "dopeshot completely transformed how I ship.\nRight now, no feature goes unshared.",
      "",
    );

    const baseSize = readRem(base.titleStyle.fontSize);
    const breakSize = readRem(withBreak.titleStyle.fontSize);

    expect(breakSize).toBeLessThan(baseSize);
  });
});
