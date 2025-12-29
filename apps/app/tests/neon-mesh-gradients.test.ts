import { strict as assert } from "node:assert";
import { converter, type Oklch } from "culori";
import { generateGradientOptions } from "@/domain/layout/gradients/generator";
import { generateNeonColor } from "@/domain/layout/gradients/colors";
import type { ColorPalette } from "@/domain/asset/types";
import type { AdvancedGradient } from "@/domain/layout/gradients/types";

const toOklch = converter("oklch");

function getOklchChroma(hex: string): number {
  const oklch = toOklch(hex) as Oklch | undefined;
  return oklch?.c ?? 0;
}

function getOklchHue(hex: string): number {
  const oklch = toOklch(hex) as Oklch | undefined;
  return oklch?.h ?? 0;
}

function calculateHueSpread(hues: number[]): number {
  if (hues.length < 2) return 0;

  // Sort hues and find the maximum gap
  const sorted = [...hues].sort((a, b) => a - b);
  let maxGap = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    maxGap = Math.max(maxGap, gap);
  }

  // Include wrap-around gap
  const wrapGap = (360 - sorted[sorted.length - 1]) + sorted[0];
  maxGap = Math.max(maxGap, wrapGap);

  // Hue spread is 360 minus the largest gap
  return 360 - maxGap;
}

function getMeshGradient(gradients: AdvancedGradient[]): AdvancedGradient | undefined {
  return gradients.find(g => g.meshLayers && g.meshLayers.length > 0);
}

function extractHexFromRgba(rgba: string): string | null {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  const [, r, g, b] = match;
  return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
}

async function testGenerateNeonColorHighChroma() {
  // Test that generateNeonColor produces high-chroma colors
  // Note: sRGB gamut severely limits certain hues:
  // - Cyan (180°) max chroma is ~0.155 (pure cyan #00FFFF)
  // - Most other hues can achieve 0.20-0.30
  // We use 0.15 as threshold to account for cyan's gamut limitation
  const testColors = [
    "#FFB6C1", // Light pink
    "#808080", // Gray
    "#4169E1", // Royal blue
    "#90EE90", // Light green
  ];

  for (const baseColor of testColors) {
    for (const offset of [0, 60, 120, 180, 240, 300]) {
      const neonColor = generateNeonColor(baseColor, offset);
      const chroma = getOklchChroma(neonColor);

      // sRGB gamut limits cyan to ~0.155; 0.15 accounts for this
      assert.ok(
        chroma >= 0.15,
        `Neon color from ${baseColor} at offset ${offset} should have chroma >= 0.15, got ${chroma.toFixed(3)}`
      );
    }
  }
}

async function testNeonPaletteHueSpread() {
  // Test that a single-color input produces colors with wide hue spread
  const singleColorPalette: ColorPalette = {
    dominant: "#FFB6C1", // Pink
    accent: "#FFB6C1",
    vibrant: "#FFB6C1",
    muted: "#FFB6C1",
  };

  const gradients = generateGradientOptions(singleColorPalette, {
    aspectCategory: "landscape",
  });

  const meshGradient = getMeshGradient(gradients);
  assert.ok(meshGradient, "Should have a mesh gradient");
  assert.ok(meshGradient.meshLayers, "Mesh gradient should have layers");
  assert.equal(meshGradient.meshLayers.length, 6, "Should have 6 mesh layers");

  // Extract colors from mesh layers
  const layerColors = meshGradient.meshLayers.map(layer => extractHexFromRgba(layer.color));
  const validColors = layerColors.filter((c): c is string => c !== null);

  assert.equal(validColors.length, 6, "Should extract 6 valid colors from layers");

  // Calculate hue spread
  const hues = validColors.map(getOklchHue);
  const spread = calculateHueSpread(hues);

  assert.ok(
    spread >= 240,
    `Hue spread should be >= 240°, got ${spread.toFixed(1)}°`
  );
}

async function testMeshLayerOpacity() {
  const palette: ColorPalette = {
    dominant: "#3b82f6",
    accent: "#3b82f6",
    vibrant: "#3b82f6",
    muted: "#f5f5f5",
  };

  const gradients = generateGradientOptions(palette, {
    aspectCategory: "landscape",
  });

  const meshGradient = getMeshGradient(gradients);
  assert.ok(meshGradient?.meshLayers, "Should have mesh layers");

  // Verify opacity values are in expected range (0.55 to 0.85)
  const opacities = meshGradient.meshLayers.map(layer => {
    const match = layer.color.match(/,\s*([\d.]+)\)$/);
    return match ? parseFloat(match[1]) : 0;
  });

  assert.ok(
    Math.max(...opacities) >= 0.80,
    `Max opacity should be >= 0.80, got ${Math.max(...opacities)}`
  );
  assert.ok(
    Math.min(...opacities) >= 0.50,
    `Min opacity should be >= 0.50, got ${Math.min(...opacities)}`
  );
}

async function testNeonColorAllHues() {
  // Test that neon colors across the spectrum all have high chroma
  // sRGB gamut limits cyan (180°) to ~0.155; use 0.15 as threshold
  const baseColor = "#FF6B6B"; // Red-ish

  for (let hue = 0; hue < 360; hue += 30) {
    const neonColor = generateNeonColor(baseColor, hue);
    const chroma = getOklchChroma(neonColor);

    assert.ok(
      chroma >= 0.15,
      `Neon color at hue offset ${hue} should have chroma >= 0.15, got ${chroma.toFixed(3)}`
    );
  }
}

async function testMonochromaticGrayProducesNeonColors() {
  // Test that even gray input produces neon colors
  const grayPalette: ColorPalette = {
    dominant: "#808080",
    accent: "#909090",
    vibrant: "#707070",
    muted: "#a0a0a0",
  };

  const gradients = generateGradientOptions(grayPalette, {
    aspectCategory: "landscape",
  });

  const meshGradient = getMeshGradient(gradients);
  assert.ok(meshGradient?.meshLayers, "Should have mesh layers");

  // Extract colors and verify they're colorful (not gray)
  const layerColors = meshGradient.meshLayers
    .map(layer => extractHexFromRgba(layer.color))
    .filter((c): c is string => c !== null);

  const chromas = layerColors.map(getOklchChroma);
  const avgChroma = chromas.reduce((a, b) => a + b, 0) / chromas.length;

  // sRGB gamut limits cyan; 0.18 accounts for mix of hues
  assert.ok(
    avgChroma >= 0.18,
    `Average chroma from gray input should be >= 0.18, got ${avgChroma.toFixed(3)}`
  );
}

async function runTests() {
  console.log("Running neon mesh gradient tests...\n");

  await testGenerateNeonColorHighChroma();
  console.log("✓ generateNeonColor produces high-chroma colors");

  await testNeonColorAllHues();
  console.log("✓ Neon colors maintain high chroma across all hues");

  await testNeonPaletteHueSpread();
  console.log("✓ Single-color input produces wide hue spread (240°+)");

  await testMeshLayerOpacity();
  console.log("✓ Mesh layers have correct opacity range");

  await testMonochromaticGrayProducesNeonColors();
  console.log("✓ Gray input produces colorful neon output");

  console.log("\nAll neon mesh gradient tests passed!");
}

runTests().catch((error) => {
  console.error("Test failed:", error);
  process.exitCode = 1;
});
