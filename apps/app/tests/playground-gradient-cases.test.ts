import { strict as assert } from "node:assert";
import { generateGradientOptions } from "@/domain/layout/gradients";
import { paletteCases } from "@/app/playground/_data/paletteCases";

function testPaletteCasesGenerateGradients() {
  paletteCases.forEach((palette) => {
    const gradients = generateGradientOptions(palette.colors, {
      aspectCategory: "landscape",
    });

    assert.ok(gradients.length > 0, `Expected gradients for ${palette.id}`);
    const primary = gradients[0];
    assert.ok(primary, `Expected primary gradient for ${palette.id}`);
    assert.ok(
      "stops" in primary || ("from" in primary && "to" in primary),
      `Gradient should have stops or legacy colors for ${palette.id}`,
    );
  });
}

testPaletteCasesGenerateGradients();
