import { describe, it, expect } from "vitest";
import { generateBrandGradients } from "@/domain/brand-palette/generator";
import { oklch } from "culori";
import type { AdvancedGradient } from "@/domain/layout/gradients/types";

describe("generateBrandGradients", () => {
  describe("basic functionality", () => {
    it("should generate exactly 2 gradients", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      expect(result).toHaveLength(2);
    });

    it("should return valid AdvancedGradient structures", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      result.forEach((gradient) => {
        expect(gradient).toHaveProperty("type");
        expect(gradient.type).toBe("linear");
        expect(gradient).toHaveProperty("stops");
        expect(gradient).toHaveProperty("angle");
        expect(gradient).toHaveProperty("colorSpace");
        expect(gradient.colorSpace).toBe("oklch");
        expect(gradient).toHaveProperty("direction");
      });
    });

    it("should throw error for invalid hex color", () => {
      expect(() => {
        generateBrandGradients({
          accentColor: "invalid-color",
          mode: "dark",
        });
      }).toThrow("Invalid accent color");
    });

    it("should handle uppercase hex colors", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      expect(result).toHaveLength(2);
    });

    it("should handle lowercase hex colors", () => {
      const result = generateBrandGradients({
        accentColor: "#ff6b35",
        mode: "dark",
      });

      expect(result).toHaveLength(2);
    });
  });

  describe("gradient structure", () => {
    it("should have 3 color stops per gradient", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      result.forEach((gradient) => {
        expect(gradient.stops).toHaveLength(3);
      });
    });

    it("should have stops at 0%, 50%, and 100%", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      result.forEach((gradient) => {
        expect(gradient.stops[0].position).toBe(0);
        expect(gradient.stops[1].position).toBe(50);
        expect(gradient.stops[2].position).toBe(100);
      });
    });

    it("should have different angles for the two gradients", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      expect(result[0].angle).not.toBe(result[1].angle);
    });

    it("should have valid hex colors in all stops", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      result.forEach((gradient) => {
        gradient.stops.forEach((stop) => {
          expect(stop.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
      });
    });
  });

  describe("accent color visibility", () => {
    it("should include accent color or its adjusted version in gradients", () => {
      const accentColor = "#FF6B35";
      const result = generateBrandGradients({
        accentColor,
        mode: "dark",
      });

      // Check if accent color appears in any stop (allowing for adjustments)
      const accentOklch = oklch(accentColor);
      let accentFound = false;

      result.forEach((gradient) => {
        gradient.stops.forEach((stop) => {
          const stopOklch = oklch(stop.color);
          if (
            stopOklch &&
            accentOklch &&
            Math.abs((stopOklch.h || 0) - (accentOklch.h || 0)) < 5
          ) {
            // Same hue (within 5 degrees)
            accentFound = true;
          }
        });
      });

      expect(accentFound).toBe(true);
    });
  });

  describe("dark mode", () => {
    it("should generate gradients with dark base colors", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      // First stop in each gradient should be dark (lightness < 0.3)
      result.forEach((gradient) => {
        const baseColor = gradient.stops[0].color;
        const baseOklch = oklch(baseColor);

        expect(baseOklch).toBeDefined();
        expect(baseOklch!.l).toBeLessThan(0.3);
      });
    });

    it("should have sufficient contrast between dark base and accent", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      result.forEach((gradient) => {
        const baseOklch = oklch(gradient.stops[0].color);
        const midOklch = oklch(gradient.stops[1].color);

        expect(baseOklch).toBeDefined();
        expect(midOklch).toBeDefined();

        // Significant lightness difference
        const lightnessDiff = Math.abs((midOklch!.l || 0) - (baseOklch!.l || 0));
        expect(lightnessDiff).toBeGreaterThan(0.3);
      });
    });
  });

  describe("light mode", () => {
    it("should generate gradients with light base colors", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "light",
      });

      // First stop in each gradient should be light (lightness > 0.7)
      result.forEach((gradient) => {
        const baseColor = gradient.stops[0].color;
        const baseOklch = oklch(baseColor);

        expect(baseOklch).toBeDefined();
        expect(baseOklch!.l).toBeGreaterThan(0.7);
      });
    });

    it("should have sufficient contrast between light base and accent", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "light",
      });

      result.forEach((gradient) => {
        const baseOklch = oklch(gradient.stops[0].color);
        const midOklch = oklch(gradient.stops[1].color);

        expect(baseOklch).toBeDefined();
        expect(midOklch).toBeDefined();

        // Significant lightness difference
        const lightnessDiff = Math.abs((midOklch!.l || 0) - (baseOklch!.l || 0));
        expect(lightnessDiff).toBeGreaterThan(0.2);
      });
    });
  });

  describe("color harmony", () => {
    it("should generate complementary colors (180° hue rotation)", () => {
      const accentColor = "#FF6B35";
      const result = generateBrandGradients({
        accentColor,
        mode: "dark",
      });

      const accentOklch = oklch(accentColor);
      let complementaryFound = false;

      // Check gradient stops for complementary color (opposite hue)
      result.forEach((gradient) => {
        gradient.stops.forEach((stop) => {
          const stopOklch = oklch(stop.color);
          if (stopOklch && accentOklch) {
            const hueDiff = Math.abs(
              ((stopOklch.h || 0) - (accentOklch.h || 0) + 360) % 360,
            );
            // Complementary is ~180 degrees (allow 20 degree tolerance)
            if (Math.abs(hueDiff - 180) < 20 || Math.abs(hueDiff + 180) < 20) {
              complementaryFound = true;
            }
          }
        });
      });

      expect(complementaryFound).toBe(true);
    });

    it("should generate analogous colors (~30° hue rotation)", () => {
      const accentColor = "#FF6B35";
      const result = generateBrandGradients({
        accentColor,
        mode: "dark",
      });

      const accentOklch = oklch(accentColor);
      let analogousFound = false;

      // Check gradient stops for analogous color (nearby hue)
      result.forEach((gradient) => {
        gradient.stops.forEach((stop) => {
          const stopOklch = oklch(stop.color);
          if (stopOklch && accentOklch) {
            const hueDiff = Math.abs((stopOklch.h || 0) - (accentOklch.h || 0));
            // Analogous is ~30 degrees (allow 20 degree tolerance)
            if (hueDiff > 10 && hueDiff < 50) {
              analogousFound = true;
            }
          }
        });
      });

      expect(analogousFound).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle pure red (#FF0000)", () => {
      const result = generateBrandGradients({
        accentColor: "#FF0000",
        mode: "dark",
      });

      expect(result).toHaveLength(2);
      result.forEach((gradient) => {
        expect(gradient.stops).toHaveLength(3);
      });
    });

    it("should handle pure blue (#0000FF)", () => {
      const result = generateBrandGradients({
        accentColor: "#0000FF",
        mode: "light",
      });

      expect(result).toHaveLength(2);
      result.forEach((gradient) => {
        expect(gradient.stops).toHaveLength(3);
      });
    });

    it("should handle neutral gray (#808080)", () => {
      const result = generateBrandGradients({
        accentColor: "#808080",
        mode: "dark",
      });

      expect(result).toHaveLength(2);
      result.forEach((gradient) => {
        expect(gradient.stops).toHaveLength(3);
      });
    });

    it("should handle very dark color (#0A0A0A)", () => {
      const result = generateBrandGradients({
        accentColor: "#0A0A0A",
        mode: "light",
      });

      expect(result).toHaveLength(2);
    });

    it("should handle very light color (#F5F5F5)", () => {
      const result = generateBrandGradients({
        accentColor: "#F5F5F5",
        mode: "dark",
      });

      expect(result).toHaveLength(2);
    });
  });

  describe("consistency", () => {
    it("should generate consistent output for same input", () => {
      const input = { accentColor: "#FF6B35", mode: "dark" as const };

      const result1 = generateBrandGradients(input);
      const result2 = generateBrandGradients(input);

      expect(result1).toEqual(result2);
    });

    it("should generate different gradients for different modes", () => {
      const accentColor = "#FF6B35";

      const darkResult = generateBrandGradients({
        accentColor,
        mode: "dark",
      });
      const lightResult = generateBrandGradients({
        accentColor,
        mode: "light",
      });

      // Base colors should be different
      expect(darkResult[0].stops[0].color).not.toBe(
        lightResult[0].stops[0].color,
      );
    });

    it("should generate different gradients for different accent colors", () => {
      const mode = "dark";

      const result1 = generateBrandGradients({
        accentColor: "#FF6B35",
        mode,
      });
      const result2 = generateBrandGradients({
        accentColor: "#3B82F6",
        mode,
      });

      // At least one stop should be different
      expect(result1[0].stops[1].color).not.toBe(result2[0].stops[1].color);
    });
  });

  describe("text readability", () => {
    it("should generate colors with reasonable lightness for text readability", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      result.forEach((gradient) => {
        gradient.stops.forEach((stop) => {
          const stopOklch = oklch(stop.color);
          expect(stopOklch).toBeDefined();

          // Lightness should be in reasonable range (not too extreme)
          expect(stopOklch!.l).toBeGreaterThanOrEqual(0);
          expect(stopOklch!.l).toBeLessThanOrEqual(1);
        });
      });
    });

    it("should ensure dark mode gradients have adequate brightness variation", () => {
      const result = generateBrandGradients({
        accentColor: "#FF6B35",
        mode: "dark",
      });

      result.forEach((gradient) => {
        const lightnesses = gradient.stops.map((stop) => {
          const oklchColor = oklch(stop.color);
          return oklchColor?.l || 0;
        });

        const maxLightness = Math.max(...lightnesses);
        const minLightness = Math.min(...lightnesses);

        // Should have significant contrast
        expect(maxLightness - minLightness).toBeGreaterThan(0.3);
      });
    });
  });
});
