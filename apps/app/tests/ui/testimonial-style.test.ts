import { describe, expect, it } from "vitest";
import { resolveTestimonialStyle } from "@/domain/layout/testimonial-style";

describe("resolveTestimonialStyle", () => {
  it("always uses yellow stars regardless of tier or brand accent", () => {
    const anonymous = resolveTestimonialStyle({
      isLoggedIn: false,
      isBrandUser: false,
      accent: "#22C55E",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });
    const defaultTier = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: false,
      accent: "#EC4899",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });
    const brand = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: true,
      personality: "hacker",
      accent: "#22C55E",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(anonymous.starColor).toBe("#FBBF24");
    expect(defaultTier.starColor).toBe("#FBBF24");
    expect(brand.starColor).toBe("#FBBF24");
  });

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

  it("uses accent-tinted background for logged-in non-brand users (light)", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: false,
      accent: "#22C55E",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("default");
    expect(style.canvasBackground).toContain("linear-gradient");
    expect(style.texture).toBe("none");
    expect(style.showDecorativeBlobs).toBe(false);
  });

  it("uses accent-tinted background for logged-in non-brand users (dark)", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: false,
      accent: "#22C55E",
      mode: "dark",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(style.tier).toBe("default");
    expect(style.canvasBackground).toContain("linear-gradient");
    expect(style.mode).toBe("dark");
  });

  it("changes non-brand background when accent changes", () => {
    const green = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: false,
      accent: "#22C55E",
      mode: "light",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    const red = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: false,
      accent: "#EF4444",
      mode: "light",
      fallbackMode: "light",
      fallbackBackground: "linear-gradient(135deg, #111111, #222222)",
    });

    expect(green.canvasBackground).not.toBe(red.canvasBackground);
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

  it("respects explicit mode and accent inputs", () => {
    const style = resolveTestimonialStyle({
      isLoggedIn: true,
      isBrandUser: true,
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
