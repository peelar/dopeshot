import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";

export type DemoPreset = {
  asset: Asset;
  config: LayoutConfig;
};

const DEMO_URLS = ["/demo1.png", "/demo1.png", "/demo2.png"];
const DEMO_TEXTS = [
  { title: "Bring the heat", subtitle: "Drop some vibes and tell the story" },
  { title: "Polished and ready", subtitle: "Clarity meets design" },
  { title: "Stand out instantly", subtitle: "Your product, amplified" },
];

const DEMO_PRESETS: DemoPreset[] = DEMO_TEXTS.map((text, index) => ({
  asset: {
    id: "placeholder-screenshot",
    projectId: "demo",
    userId: "demo",
    name: "Demo",
    url: DEMO_URLS[index],
    kind: "screenshot",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  config: {
    layoutId: "popup-gradient-left", // Use flattened layout ID (first in rail)
    variant: "left",
    // fontStyle intentionally omitted so personality font is used as default
    text,
    colors: {
      background: "slate-900",
      text: "slate-50",
      accent: "violet-400",
    },
    background: {
      type: "gradient",
      value: "custom",
    },
    assets: {
      screenshot: "placeholder-screenshot",
    },
    screenshotFrame: {
      preset: "soft-glass",
      canvasMode: "locked",
      lockedAspectRatio: 16 / 9,
      shadowEnabled: true,
      shape: "rounded",
    },
  },
}));

/**
 * Returns the default demo preset (first preset).
 * Used for SSR to ensure consistent hydration.
 */
export function getDefaultDemoPreset(): DemoPreset {
  return DEMO_PRESETS[0];
}

/**
 * Returns a randomly selected demo preset.
 * Call this client-side only to avoid hydration issues.
 */
export function getRandomDemoPreset(): DemoPreset {
  const randomIndex = Math.floor(Math.random() * DEMO_PRESETS.length);
  return DEMO_PRESETS[randomIndex];
}
