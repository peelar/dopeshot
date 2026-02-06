import { describe, expect, it } from "vitest";
import { resolveTestimonialStyle } from "@/domain/layout/testimonial-style";

describe("resolveTestimonialStyle", () => {
  it("keeps fallback background for anonymous users", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: false,
      isBrandUser: false,
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("anonymous");
    expect(style.canvasBackground).toBe("linear-gradient(135deg, #111111, #222222)");
  });

  it("uses neutral solid background for logged-in non-brand users (light)", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: false,
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("default");
    expect(style.canvasBackground).toBe("#E2E8F0");
    expect(style.texture).toBe("none");
    expect(style.showDecorativeBlobs).toBe(false);
  });

  it("uses neutral solid background for logged-in non-brand users (dark)", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: false,
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("default");
    expect(style.canvasBackground).toBe("#0F172A");
    expect(style.mode).toBe("dark");
  });

  it("applies founder defaults for brand users when personality is missing", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: true,
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

  it("applies hipster-specific texture and blobs for brand users", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: true,
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

  it("applies kawaii-specific rounded treatment for brand users", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: true,
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

  it("applies hacker-specific scanlines treatment for brand users", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: true,
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
      isLoggedIn: true,
      isBrandUser: true,
      personality: "founder",
      accent: "not-a-hex",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.accent).toBe("#6366F1");
  });
});
