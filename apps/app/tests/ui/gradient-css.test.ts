import { describe, it, expect } from "vitest";
import { customGradientToCss } from "@/domain/layout/gradients/utils";
import type { AdvancedGradient, CustomGradient } from "@/domain/layout/gradients/types";

describe("customGradientToCss", () => {
  describe("OKLCH interpolation", () => {
    it("emits 'in oklch' for linear gradients with oklch color space", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        stops: [
          { color: "#ec4899", position: 0 },
          { color: "#8b5cf6", position: 100 },
        ],
        angle: 90,
        colorSpace: "oklch",
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe(
        "linear-gradient(in oklch, 90deg, #ec4899 0%, #8b5cf6 100%)",
      );
    });

    it("emits 'in oklch' for radial gradients", () => {
      const gradient: AdvancedGradient = {
        type: "radial",
        direction: "circle at 30% 35%",
        stops: [
          { color: "#fbbf24", position: 0 },
          { color: "#a855f7", position: 45 },
          { color: "#6366f1", position: 100 },
        ],
        colorSpace: "oklch",
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe(
        "radial-gradient(in oklch, circle at 30% 35%, #fbbf24 0%, #a855f7 45%, #6366f1 100%)",
      );
    });

    it("emits 'in oklch' for conic gradients", () => {
      const gradient: AdvancedGradient = {
        type: "conic",
        direction: "from 0deg at center",
        stops: [
          { color: "#ef4444", position: 0 },
          { color: "#3b82f6", position: 100 },
        ],
        colorSpace: "oklch",
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe(
        "conic-gradient(in oklch, from 0deg at center, #ef4444 0%, #3b82f6 100%)",
      );
    });

    it("emits 'in oklab' when oklab color space is set", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        stops: [
          { color: "#ffffff", position: 0 },
          { color: "#1e3a5f", position: 100 },
        ],
        angle: 180,
        colorSpace: "oklab",
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe(
        "linear-gradient(in oklab, 180deg, #ffffff 0%, #1e3a5f 100%)",
      );
    });
  });

  describe("hue interpolation keywords", () => {
    it("emits 'shorter hue' for oklch with shorter hue interpolation", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        stops: [
          { color: "#ef4444", position: 0 },
          { color: "#3b82f6", position: 100 },
        ],
        angle: 90,
        colorSpace: "oklch",
        hueInterpolation: "shorter",
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe(
        "linear-gradient(in oklch shorter hue, 90deg, #ef4444 0%, #3b82f6 100%)",
      );
    });

    it("emits 'longer hue' for oklch with longer hue interpolation", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        stops: [
          { color: "#ef4444", position: 0 },
          { color: "#22c55e", position: 100 },
        ],
        angle: 90,
        colorSpace: "oklch",
        hueInterpolation: "longer",
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe(
        "linear-gradient(in oklch longer hue, 90deg, #ef4444 0%, #22c55e 100%)",
      );
    });

    it("ignores hue keywords for non-polar color spaces like oklab", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        stops: [
          { color: "#ef4444", position: 0 },
          { color: "#3b82f6", position: 100 },
        ],
        angle: 90,
        colorSpace: "oklab",
        hueInterpolation: "longer",
      };
      const css = customGradientToCss(gradient);
      // oklab is rectangular — no hue keyword
      expect(css).toBe(
        "linear-gradient(in oklab, 90deg, #ef4444 0%, #3b82f6 100%)",
      );
    });
  });

  describe("mesh gradients with OKLCH", () => {
    it("injects 'in oklch' into mesh radial layers", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        stops: [
          { color: "#a855f7", position: 0 },
          { color: "#6366f1", position: 100 },
        ],
        colorSpace: "oklch",
        meshLayers: [
          { color: "rgba(168, 85, 247, 0.8)", position: { x: 12, y: 18 }, size: 74 },
        ],
      };
      const css = customGradientToCss(gradient);
      expect(css).toContain("radial-gradient(in oklch, ellipse 74% 74% at 12% 18%");
      expect(css).toContain("linear-gradient(in oklch, 135deg");
    });
  });

  describe("aurora gradients with OKLCH", () => {
    it("injects 'in oklch' into all aurora layers", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        angle: 135,
        stops: [
          { color: "#a855f7", position: 0 },
          { color: "#6366f1", position: 40 },
          { color: "#ec4899", position: 72 },
          { color: "#fbbf24", position: 100 },
        ],
        colorSpace: "oklch",
      };
      const css = customGradientToCss(gradient);
      // All 4 layers should have 'in oklch'
      const layers = css.split(", linear-gradient(");
      expect(layers.length).toBe(4);
      expect(css).toMatch(/^linear-gradient\(in oklch,/);
    });
  });

  describe("legacy gradients", () => {
    it("renders legacy gradients without color space (backward compat)", () => {
      const gradient: CustomGradient = {
        from: "#ec4899",
        to: "#8b5cf6",
        direction: "to right",
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe("linear-gradient(to right, #ec4899, #8b5cf6)");
    });
  });

  describe("no color space", () => {
    it("omits color space prefix when colorSpace is undefined", () => {
      const gradient: AdvancedGradient = {
        type: "linear",
        stops: [
          { color: "#ec4899", position: 0 },
          { color: "#8b5cf6", position: 100 },
        ],
        angle: 90,
      };
      const css = customGradientToCss(gradient);
      expect(css).toBe("linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)");
    });
  });
});
