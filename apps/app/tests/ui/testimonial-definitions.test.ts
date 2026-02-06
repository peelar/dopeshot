import { describe, it, expect } from "vitest";
import {
  LAYOUT_DEFINITIONS,
  getLayoutDefinition,
  getLayoutFormat,
  getLayoutsForFormat,
  withLayoutTextDefaults,
} from "@/domain/layout-def/definitions";

describe("Testimonial layout definitions", () => {
  describe("getLayoutFormat", () => {
    it("returns 'screenshot' for popup-gradient layouts", () => {
      expect(getLayoutFormat("popup-gradient-left")).toBe("screenshot");
      expect(getLayoutFormat("popup-gradient-right")).toBe("screenshot");
      expect(getLayoutFormat("popup-gradient-center")).toBe("screenshot");
    });

    it("returns 'screenshot' for hero-center layouts", () => {
      expect(getLayoutFormat("hero-center-left")).toBe("screenshot");
      expect(getLayoutFormat("hero-center-right")).toBe("screenshot");
    });

    it("returns 'screenshot' for adaptive-stage layout", () => {
      expect(getLayoutFormat("adaptive-stage")).toBe("screenshot");
    });

    it("returns 'testimonial' for testimonial layout", () => {
      expect(getLayoutFormat("testimonial")).toBe("testimonial");
    });

    it("returns 'testimonial' for legacy testimonial variant IDs", () => {
      expect(getLayoutFormat("testimonial-centered")).toBe("testimonial");
      expect(getLayoutFormat("testimonial-card")).toBe("testimonial");
      expect(getLayoutFormat("testimonial-editorial")).toBe("testimonial");
    });

    it("returns 'screenshot' as fallback for unknown layouts", () => {
      expect(getLayoutFormat("nonexistent")).toBe("screenshot");
    });
  });

  describe("getLayoutsForFormat", () => {
    it("returns only screenshot layouts for 'screenshot' format", () => {
      const screenshotLayouts = getLayoutsForFormat("screenshot");
      expect(screenshotLayouts.length).toBe(6); // 3 peak + 2 spotlight + 1 backdrop
      expect(screenshotLayouts.every((l) => l.format === "screenshot")).toBe(true);
    });

    it("returns only testimonial layouts for 'testimonial' format", () => {
      const testimonialLayouts = getLayoutsForFormat("testimonial");
      expect(testimonialLayouts.length).toBe(1); // single testimonial layout
      expect(testimonialLayouts.every((l) => l.format === "testimonial")).toBe(true);
    });

    it("testimonial layout ID is 'testimonial'", () => {
      const testimonialLayouts = getLayoutsForFormat("testimonial");
      const ids = testimonialLayouts.map((l) => l.id);
      expect(ids).toContain("testimonial");
    });
  });

  describe("testimonial in LAYOUT_DEFINITIONS", () => {
    it("has exactly 1 testimonial entry", () => {
      const testimonialEntries = LAYOUT_DEFINITIONS.filter((l) =>
        l.id.startsWith("testimonial"),
      );
      expect(testimonialEntries).toHaveLength(1);
    });

    it("testimonial has correct display name", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def?.name).toBe("Testimonial");
    });
  });

  describe("testimonial createConfig", () => {
    it("produces a valid LayoutConfig", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def).toBeDefined();

      const config = def!.createConfig();
      expect(config.layoutId).toBe("testimonial");
      expect(config.variant).toBe("default");
      expect(config.text).toBeDefined();
      expect(config.colors).toBeDefined();
      expect(config.background).toBeDefined();
      expect(config.assets).toBeDefined();
    });

    it("includes default testimonial settings", () => {
      const def = getLayoutDefinition("testimonial");
      const config = def!.createConfig();

      expect(config.layoutSpecificSettings?.testimonial).toBeDefined();
      expect(config.layoutSpecificSettings?.testimonial?.starRating).toBe(5);
      expect(config.layoutSpecificSettings?.testimonial?.exportAspect).toBe("3:4");
    });

    it("includes highlighted rich text for the default quote", () => {
      const def = getLayoutDefinition("testimonial");
      const config = def!.createConfig();

      expect(config.layoutSpecificSettings?.richText?.title).toEqual([
        { text: "dopeshot", marks: ["highlight-1"] },
        { text: " completely transformed how I ship. Right now, no feature goes unshared." },
      ]);
    });

    it("legacy variant IDs resolve to the same definition", () => {
      const fromBase = getLayoutDefinition("testimonial");
      const fromCentered = getLayoutDefinition("testimonial-centered");
      const fromCard = getLayoutDefinition("testimonial-card");
      const fromEditorial = getLayoutDefinition("testimonial-editorial");

      expect(fromBase).toBe(fromCentered);
      expect(fromBase).toBe(fromCard);
      expect(fromBase).toBe(fromEditorial);
    });
  });

  describe("testimonial capabilities", () => {
    it("has screenshot hidden", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def?.capabilities.screenshot).toBe("hidden");
    });

    it("has headline required (for the quote body)", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def?.capabilities.text.headline).toBe("required");
    });

    it("has subtitle hidden", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def?.capabilities.text.subtitle).toBe("hidden");
    });

    it("supports typography", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def?.capabilities.typography).toBe(true);
    });

    it("supports logo", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def?.capabilities.logo).toBe("supported");
    });

    it("supports both orientations", () => {
      const def = getLayoutDefinition("testimonial");
      expect(def?.capabilities.supportedOrientations).toEqual(["mobile", "desktop"]);
    });
  });

  describe("withLayoutTextDefaults for testimonials", () => {
    it("applies default quote text when title is empty", () => {
      const def = getLayoutDefinition("testimonial");
      const config = def!.createConfig();

      const result = withLayoutTextDefaults(config);
      expect(result.text.title).toBe(
        "dopeshot completely transformed how I ship. Right now, no feature goes unshared.",
      );
    });

    it("preserves user-provided text", () => {
      const def = getLayoutDefinition("testimonial");
      const config = {
        ...def!.createConfig(),
        text: { title: "My custom quote", subtitle: "" },
      };

      const result = withLayoutTextDefaults(config);
      expect(result.text.title).toBe("My custom quote");
    });
  });
});
