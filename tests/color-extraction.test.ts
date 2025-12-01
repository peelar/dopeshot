import { strict as assert } from "node:assert";
import { extractPaletteFromImage } from "@/domain/gradient-generation/color-extraction";
import { createTestImage } from "./helpers/image-factory";

async function runTests() {
  const buffer = await createTestImage({
    width: 400,
    height: 400,
    background: { r: 25, g: 35, b: 70 },
    overlays: [
      {
        color: { r: 239, g: 68, b: 68 },
        width: 120,
        left: 140,
      },
    ],
  });

  const result = await extractPaletteFromImage(buffer, { debug: true });

  assert.ok(result.accentColors.length >= 1, "Should detect at least one accent color");
  assert.ok(result.baseColors.length >= 1, "Should retain base colors");
  assert.ok(result.colors.length >= 2, "Should include clustered palette");

  const dominantAccent = result.accentColors[0];
  assert.ok(dominantAccent.saturation > 0.4, "Accent color should be saturated");
  assert.ok(dominantAccent.population < 0.6, "Accent should not dominate entire palette");

  const grayBuffer = await createTestImage({
    width: 300,
    height: 300,
    background: { r: 220, g: 220, b: 220 },
    overlays: [
      {
        color: { r: 200, g: 200, b: 200 },
        width: 100,
        left: 100,
      },
    ],
  });

  const grayResult = await extractPaletteFromImage(grayBuffer);

  assert.ok(grayResult.colors.length > 0, "Should still return colors");
  assert.ok(grayResult.baseColors.length > 0, "Should include base tones");
  assert.ok(grayResult.accentColors.length >= 1, "Should force at least one accent for downstream usage");
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
