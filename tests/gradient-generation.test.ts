import { strict as assert } from "node:assert";
import chroma from "chroma-js";

import { generateGradientFromImage } from "@/domain/gradient-generation";
import { createTestImage } from "./helpers/image-factory";

async function testMultiAccentStrategy() {
  const buffer = await createTestImage({
    width: 420,
    height: 320,
    background: "#111827",
    overlays: [
      { color: "#f97316", width: 140, left: 30 },
      { color: "#22d3ee", width: 140, left: 210 },
    ],
  });

  const result = await generateGradientFromImage(buffer, { debug: true });
  assert.ok(result.debugInfo?.strategy === "multi-accent", "Expected multi-accent strategy");

  const accents = ["#f97316", "#22d3ee"];
  accents.forEach((accent) => {
    const distance = Math.min(
      colorDistance(result.colorStart, accent),
      colorDistance(result.colorEnd, accent),
    );
    assert.ok(distance < 25, `Accent ${accent} should influence gradient (distance ${distance.toFixed(2)})`);
  });
}

async function testSingleAccentStrategy() {
  const buffer = await createTestImage({
    width: 400,
    height: 320,
    background: "#1e293b",
    overlays: [{ color: "#a855f7", width: 160, left: 120 }],
  });

  const result = await generateGradientFromImage(buffer, { debug: true });
  assert.ok(result.debugInfo?.strategy === "single-accent", "Expected single-accent strategy");

  const accentDistance = Math.min(
    colorDistance(result.colorStart, "#a855f7"),
    colorDistance(result.colorEnd, "#a855f7"),
  );
  assert.ok(accentDistance < 25, "Accent color should appear in gradient");

  const startLight = chroma(result.colorStart).lab()[0];
  const endLight = chroma(result.colorEnd).lab()[0];
  assert.ok(Math.abs(startLight - endLight) >= 5, "Gradient colors should have lightness contrast");
}

async function testMonochromeFallback() {
  const buffer = await createTestImage({
    width: 320,
    height: 320,
    background: "#d4d4d4",
    overlays: [{ color: "#c3c3c3", width: 80, left: 120 }],
  });

  const result = await generateGradientFromImage(buffer, { debug: true });
  assert.ok(result.debugInfo?.strategy === "monochrome", "Expected monochrome fallback strategy");
  assert.ok(colorDistance(result.colorStart, result.colorEnd) >= 8, "Monochrome colors need contrast");
}

async function testTemperaturePreference() {
  const buffer = await createTestImage({
    width: 280,
    height: 280,
    background: "#c9c9c9",
  });

  const warm = await generateGradientFromImage(buffer, {
    debug: true,
    preferences: { temperature: "warm", intensity: "bold", angle: 60 },
  });
  const cool = await generateGradientFromImage(buffer, {
    debug: true,
    preferences: { temperature: "cool", intensity: "soft", angle: 20 },
  });

  assert.equal(warm.angle, 60, "Warm preferences should override angle");
  assert.equal(cool.angle, 20, "Cool preferences should override angle");

  const warmDistanceToWarmAnchor = colorDistance(warm.colorStart, "#f97316");
  const coolDistanceToWarmAnchor = colorDistance(cool.colorStart, "#f97316");
  assert.ok(
    warmDistanceToWarmAnchor < coolDistanceToWarmAnchor,
    "Warm gradient should lean toward warm hues",
  );

  const coolDistanceToCoolAnchor = colorDistance(cool.colorStart, "#22d3ee");
  const warmDistanceToCoolAnchor = colorDistance(warm.colorStart, "#22d3ee");
  assert.ok(
    coolDistanceToCoolAnchor < warmDistanceToCoolAnchor,
    "Cool gradient should lean toward cool hues",
  );
}

function colorDistance(a: string, b: string): number {
  const [l1, a1, b1] = chroma(a).lab();
  const [l2, a2, b2] = chroma(b).lab();
  const dL = l1 - l2;
  const dA = a1 - a2;
  const dB = b1 - b2;
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

async function runGradientTests() {
  await testMultiAccentStrategy();
  await testSingleAccentStrategy();
  await testMonochromeFallback();
  await testTemperaturePreference();
}

runGradientTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
