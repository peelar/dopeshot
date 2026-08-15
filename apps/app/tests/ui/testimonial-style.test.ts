import { describe, expect, it } from "vitest";
import { resolveTestimonialStyle } from "@/domain/layout/testimonial-style";

describe("resolveTestimonialStyle", () => {
  it("always uses yellow stars regardless of brand accent", () => {
    const anonymous = resolveTestimonialStyle({
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });
    const withAccent = resolveTestimonialStyle({
      accent: "#EC4899",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });
    const brand = resolveTestimonialStyle({
      personality: "hacker",
      accent: "#22C55E",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(anonymous.starColor).toBe("#FBBF24");
    expect(withAccent.starColor).toBe("#FBBF24");
    expect(brand.starColor).toBe("#FBBF24");
  });

  it("keeps fallback background when no brand kit is set", () => {
    const style = resolveTestimonialStyle({
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("anonymous");
    expect(style.canvasBackground).toBe("linear-gradient(135deg, #111111, #222222)");
  });

  it("applies founder defaults when personality is missing but a kit is set", () => {
    const style = resolveTestimonialStyle({
      accent: "#22C55E",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("brand");
    expect(style.personality).toBe("founder");
    expect(style.texture).toBe("none");
    expect(style.showDecorativeBlobs).toBe(false);
  });

  it("applies hipster-specific texture and blobs", () => {
    const style = resolveTestimonialStyle({
      personality: "hipster",
      accent: "#F97316",
      mode: "light",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("brand");
    expect(style.texture).toBe("grain");
    expect(style.textureIntensity).toBeGreaterThan(0.5);
    expect(style.showDecorativeBlobs).toBe(true);
  });

  it("applies kawaii-specific rounded treatment", () => {
    const style = resolveTestimonialStyle({
      personality: "kawaii",
      accent: "#EC4899",
      mode: "light",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("brand");
    expect(style.cardRadius).toBeGreaterThanOrEqual(26);
    expect(style.showDecorativeBlobs).toBe(true);
  });

  it("applies hacker-specific scanlines treatment", () => {
    const style = resolveTestimonialStyle({
      personality: "hacker",
      accent: "#22C55E",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("brand");
    expect(style.texture).toBe("scanlines");
    expect(style.showDecorativeBlobs).toBe(false);
  });

  it("falls back to default accent when accent is invalid", () => {
    const style = resolveTestimonialStyle({
      personality: "founder",
      accent: "not-a-hex",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.accent).toBe("#6366F1");
  });

  it("respects explicit mode and accent inputs", () => {
    const style = resolveTestimonialStyle({
      personality: "founder",
      accent: "#123456",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.mode).toBe("dark");
    expect(style.accent).toBe("#123456");
  });
});
