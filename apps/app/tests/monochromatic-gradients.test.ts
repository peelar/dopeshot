import { strict as assert } from "node:assert";
import chroma from "chroma-js";
import { generateGradientOptions } from "@/domain/layout/gradients/generator";
import type { ColorPalette } from "@/domain/asset/types";

function getHueDifference(colorA: string, colorB: string): number {
  const hueA = chroma(colorA).hsl()[0] ?? 0;
  const hueB = chroma(colorB).hsl()[0] ?? 0;
  const diff = Math.abs(hueA - hueB);
  return Math.min(diff, 360 - diff);
}

async function testMonochromaticDistinctGradients() {
  // Simulate a monochromatic palette (orange + white scenario like in screenshots)
  const monochromaticPalette: ColorPalette = {
    dominant: "#f97316", // orange
    accent: "#fb923c", // similar orange
    vibrant: "#f97316", // same orange
    muted: "#fafafa", // white-ish
  };

  const gradients = generateGradientOptions(monochromaticPalette, {
    aspectCategory: "landscape",
  });

  const endColors: string[] = [];

  gradients.forEach((g) => {
    const end = g.stops[g.stops.length - 1]?.color ?? "N/A";
    endColors.push(end);
  });

  // Check that we have distinct hues in the end colors
  const uniqueHues = new Set(endColors.map((c) => Math.round(chroma(c).hsl()[0] ?? 0)));

  // We should have at least 3 distinct hue values
  assert.ok(uniqueHues.size >= 3, `Expected at least 3 distinct hues, got ${uniqueHues.size}`);

  // Check that complementary (gradient 2) has significant hue difference
  const gradient2HueDiff = getHueDifference(
    gradients[1].stops[0]?.color ?? "",
    gradients[1].stops[1]?.color ?? "",
  );
  assert.ok(
    gradient2HueDiff > 120,
    `Complementary gradient should have large hue diff, got ${gradient2HueDiff}°`,
  );

  // Check that triadic (gradient 3) has significant hue difference
  const gradient3HueDiff = getHueDifference(
    gradients[2].stops[0]?.color ?? "",
    gradients[2].stops[1]?.color ?? "",
  );
  assert.ok(
    gradient3HueDiff > 90,
    `Triadic gradient should have significant hue diff, got ${gradient3HueDiff}°`,
  );
}

async function testNonMonochromaticPreservesExistingBehavior() {
  // Non-monochromatic palette with varied colors
  const variedPalette: ColorPalette = {
    dominant: "#3b82f6", // blue
    accent: "#f97316", // orange
    vibrant: "#22c55e", // green
    muted: "#6b7280", // gray
  };

  const gradients = generateGradientOptions(variedPalette, {
    aspectCategory: "landscape",
  });

  // Verify we got 6 gradients (4 linear + mesh + aurora)
  assert.equal(gradients.length, 6, "Should generate 6 gradient options");
}

async function runTests() {
  await testMonochromaticDistinctGradients();
  await testNonMonochromaticPreservesExistingBehavior();
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
