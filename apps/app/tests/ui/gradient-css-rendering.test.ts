import { afterEach, describe, expect, it, vi } from "vitest";
import type { LayoutConfig } from "@/domain/layout/types";
import { customGradientToCss } from "@/domain/layout/gradients";
import { getBackgroundStyle } from "@/components/layouts/shared/background-style";

function createBaseConfig(): LayoutConfig {
  return {
    layoutId: "popup-gradient",
    variant: "right",
    text: {
      title: "",
      subtitle: "",
    },
    colors: {
      background: "indigo-50",
      text: "slate-900",
      accent: "violet-400",
    },
    background: {
      type: "gradient",
      value: "custom",
    },
    assets: {},
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("customGradientToCss interpolation rendering", () => {
  it("falls back to standard gradient syntax when interpolation is unsupported", () => {
    vi.stubGlobal("CSS", undefined);

    const css = customGradientToCss({
      type: "linear",
      angle: 45,
      colorSpace: "oklab",
      stops: [
        { color: "#111111", position: 0 },
        { color: "#eeeeee", position: 100 },
      ],
    });

    expect(css).toBe("linear-gradient(45deg, #111111 0%, #eeeeee 100%)");
  });

  it("emits modern interpolation syntax when supported", () => {
    const supports = vi.fn(() => true);
    vi.stubGlobal("CSS", { supports });

    const css = customGradientToCss({
      type: "linear",
      angle: 45,
      colorSpace: "oklab",
      stops: [
        { color: "#111111", position: 0 },
        { color: "#eeeeee", position: 100 },
      ],
    });

    expect(css).toBe("linear-gradient(in oklab 45deg, #111111 0%, #eeeeee 100%)");
    expect(supports).toHaveBeenCalled();
  });

  it("includes hue interpolation keywords for polar color spaces", () => {
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });

    const css = customGradientToCss({
      type: "linear",
      angle: 120,
      colorSpace: "oklch",
      hueInterpolation: "longer",
      stops: [
        { color: "#f59e0b", position: 0 },
        { color: "#6366f1", position: 100 },
      ],
    });

    expect(css).toBe("linear-gradient(in oklch longer hue 120deg, #f59e0b 0%, #6366f1 100%)");
  });

  it("ignores hue interpolation keywords for non-polar color spaces", () => {
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });

    const css = customGradientToCss({
      type: "linear",
      angle: 120,
      colorSpace: "oklab",
      hueInterpolation: "longer",
      stops: [
        { color: "#f59e0b", position: 0 },
        { color: "#6366f1", position: 100 },
      ],
    });

    expect(css).toBe("linear-gradient(in oklab 120deg, #f59e0b 0%, #6366f1 100%)");
  });
});

describe("getBackgroundStyle layout rendering", () => {
  it("preserves interpolation metadata while applying layout-specific angle", () => {
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });

    const config = createBaseConfig();
    config.background.customGradient = {
      type: "linear",
      angle: 135,
      colorSpace: "oklab",
      stops: [
        { color: "#10b981", position: 0 },
        { color: "#ec4899", position: 100 },
      ],
    };

    const css = getBackgroundStyle(config, new Map());

    // popup-gradient + right variant maps to 270deg in layout renderer
    expect(css).toBe("linear-gradient(in oklab 270deg, #10b981 0%, #ec4899 100%)");
  });
});
