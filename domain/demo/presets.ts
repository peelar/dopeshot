import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { withTemplateTextDefaults } from "@/domain/layout/templates";

export type DemoPreset = {
  asset: Asset;
  config: LayoutConfig;
};

// Base demo asset used for all demos
// Includes a color palette so gradient picker knows to show "From screenshot" tab
const DEMO_ASSET: Asset = {
  id: "placeholder-screenshot",
  projectId: "demo",
  userId: "demo-user",
  name: "Placeholder screenshot",
  url: "/demo.png",
  kind: "screenshot",
  createdAt: "2024-01-01T00:00:00.000Z",
  metadata: {
    width: 3060,
    height: 1896,
    aspectRatio: 3060 / 1896,
    orientation: "landscape",
  },
  colorPalette: {
    dominant: "#312e81",
    accent: "#c026d3",
    muted: "#0f172a",
    vibrant: "#7c3aed",
  },
};

/**
 * Demo text options - randomly selected on load
 */
const DEMO_TEXT_OPTIONS = [
  { title: "Bring the heat", subtitle: "Drop some vibes and tell the story" },
  { title: "Polished and ready", subtitle: "Clarity meets design" },
  { title: "Stand out instantly", subtitle: "Your product, amplified" },
];

function createDemoPreset(text: { title: string; subtitle: string }): DemoPreset {
  return {
    asset: DEMO_ASSET,
    config: withTemplateTextDefaults({
      templateId: "popup-gradient",
      variant: "center",
      fontId: "clean",
      fontSize: "xl",
      text,
      colors: {
        background: "slate-900",
        text: "slate-50",
        accent: "violet-400",
      },
      background: {
        type: "gradient",
        value: "custom",
        grainEnabled: true,
        // customGradient will be set by color analysis pipeline
      },
      assets: {
        screenshot: DEMO_ASSET.id,
      },
      screenshotFrame: {
        preset: "soft-glass",
        canvasMode: "locked",
        lockedAspectRatio: 16 / 9,
        shadowEnabled: true,
        shape: "rounded",
      },
    }),
  };
}

/**
 * Returns the default demo preset (first text option).
 * Used for SSR to ensure consistent hydration.
 */
export function getDefaultDemoPreset(): DemoPreset {
  return createDemoPreset(DEMO_TEXT_OPTIONS[0]);
}

/**
 * Returns a demo preset with randomly selected text.
 * Call this client-side only to avoid hydration issues.
 */
export function getRandomDemoPreset(): DemoPreset {
  const randomIndex = Math.floor(Math.random() * DEMO_TEXT_OPTIONS.length);
  return createDemoPreset(DEMO_TEXT_OPTIONS[randomIndex]);
}
