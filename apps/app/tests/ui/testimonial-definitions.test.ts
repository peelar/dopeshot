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

    it("returns 'testimonial' for testimonial layouts", () => {
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
      expect(testimonialLayouts.length).toBe(3); // centered, card, editorial
      expect(testimonialLayouts.every((l) => l.format === "testimonial")).toBe(true);
    });

    it("testimonial layout IDs are correctly expanded with variant suffixes", () => {
      const testimonialLayouts = getLayoutsForFormat("testimonial");
      const ids = testimonialLayouts.map((l) => l.id);
      expect(ids).toContain("testimonial-centered");
      expect(ids).toContain("testimonial-card");
      expect(ids).toContain("testimonial-editorial");
    });
  });

  describe("expandLayoutVariants for testimonials", () => {
    it("creates 3 testimonial variant entries in LAYOUT_DEFINITIONS", () => {
      const testimonialEntries = LAYOUT_DEFINITIONS.filter((l) =>
        l.id.startsWith("testimonial"),
      );
      expect(testimonialEntries).toHaveLength(3);
    });

    it("testimonial variants have correct display names", () => {
      const centered = getLayoutDefinition("testimonial-centered");
      const card = getLayoutDefinition("testimonial-card");
      const editorial = getLayoutDefinition("testimonial-editorial");

      expect(centered?.name).toBe("Testimonial Centered");
      expect(card?.name).toBe("Testimonial Card");
      expect(editorial?.name).toBe("Testimonial Editorial");
    });
  });

  describe("testimonial createConfig", () => {
    it("produces a valid LayoutConfig", () => {
      const def = getLayoutDefinition("testimonial-centered");
      expect(def).toBeDefined();

      const config = def!.createConfig();
      expect(config.layoutId).toBe("testimonial-centered");
      expect(config.variant).toBe("centered");
      expect(config.text).toBeDefined();
      expect(config.colors).toBeDefined();
      expect(config.background).toBeDefined();
      expect(config.assets).toBeDefined();
    });

    it("includes default testimonial settings", () => {
      const def = getLayoutDefinition("testimonial-centered");
      const config = def!.createConfig();

      expect(config.layoutSpecificSettings?.testimonial).toBeDefined();
      expect(config.layoutSpecificSettings?.testimonial?.starRating).toBe(5);
    });

    it("each variant has its variant baked in", () => {
      const centered = getLayoutDefinition("testimonial-centered")!.createConfig();
      const card = getLayoutDefinition("testimonial-card")!.createConfig();
      const editorial = getLayoutDefinition("testimonial-editorial")!.createConfig();

      expect(centered.variant).toBe("centered");
      expect(card.variant).toBe("card");
      expect(editorial.variant).toBe("editorial");
    });
  });

  describe("testimonial capabilities", () => {
    it("has screenshot hidden", () => {
      const def = getLayoutDefinition("testimonial-centered");
      expect(def?.capabilities.screenshot).toBe("hidden");
    });

    it("has headline required (for the quote body)", () => {
      const def = getLayoutDefinition("testimonial-centered");
      expect(def?.capabilities.text.headline).toBe("required");
    });

    it("has subtitle hidden", () => {
      const def = getLayoutDefinition("testimonial-centered");
      expect(def?.capabilities.text.subtitle).toBe("hidden");
    });

    it("supports typography", () => {
      const def = getLayoutDefinition("testimonial-centered");
      expect(def?.capabilities.typography).toBe(true);
    });

    it("supports logo", () => {
      const def = getLayoutDefinition("testimonial-centered");
      expect(def?.capabilities.logo).toBe("supported");
    });

    it("supports both orientations", () => {
      const def = getLayoutDefinition("testimonial-centered");
      expect(def?.capabilities.supportedOrientations).toEqual(["mobile", "desktop"]);
    });
  });

  describe("withLayoutTextDefaults for testimonials", () => {
    it("applies default quote text when title is empty", () => {
      const def = getLayoutDefinition("testimonial-centered");
      const config = def!.createConfig();

      const result = withLayoutTextDefaults(config);
      expect(result.text.title).toBe(
        "This product completely transformed how we work. The results speak for themselves.",
      );
    });

    it("preserves user-provided text", () => {
      const def = getLayoutDefinition("testimonial-centered");
      const config = {
        ...def!.createConfig(),
        text: { title: "My custom quote", subtitle: "" },
      };

      const result = withLayoutTextDefaults(config);
      expect(result.text.title).toBe("My custom quote");
    });
  });
});
