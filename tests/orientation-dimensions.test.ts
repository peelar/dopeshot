import { getCanvasDimensions } from "@/domain/layout/screenshot-mode";
import type { LayoutConfig } from "@/domain/layout/types";

// Mock layout config with locked canvas mode
const mockLockedConfig: LayoutConfig = {
  layoutId: "popup-gradient-center",
  variant: "center",
  fontId: "clean",
  fontSize: "lg",
  text: { title: "Test", subtitle: "" },
  colors: { background: "slate-50", text: "slate-900", accent: "violet-400" },
  background: { type: "gradient", value: "sunset", gradientSource: "preset", grainEnabled: true, patternMode: "auto" },
  assets: { screenshot: undefined, logo: undefined, background: undefined },
  screenshotShadow: "medium",
  screenshotFrame: {
    preset: "soft-glass",
    canvasMode: "locked",
    lockedAspectRatio: 16 / 9,
    shadowEnabled: true,
    shape: "rounded",
  },
};

console.log("Testing orientation-based canvas dimensions...\n");

// Test desktop orientation (16:9)
const desktop = getCanvasDimensions(mockLockedConfig, null, "desktop");
console.log("✓ Desktop:", desktop);
if (desktop.width !== 1920 || desktop.height !== 1080) {
  throw new Error(`Expected 1920×1080 for desktop, got ${desktop.width}×${desktop.height}`);
}

// Test mobile orientation (9:16)
const mobile = getCanvasDimensions(mockLockedConfig, null, "mobile");
console.log("✓ Mobile:", mobile);
if (mobile.width !== 1080 || mobile.height !== 1920) {
  throw new Error(`Expected 1080×1920 for mobile, got ${mobile.width}×${mobile.height}`);
}

// Test aspect ratios
console.log("\n✓ Desktop aspect ratio:", desktop.aspectRatio.toFixed(4), "(expected 1.7778 for 16:9)");
console.log("✓ Mobile aspect ratio:", mobile.aspectRatio.toFixed(4), "(expected 0.5625 for 9:16)");

console.log("\n✅ All orientation dimension tests passed!");
