"use client";

import { useEffect, useState } from "react";
import { paletteCases } from "../_data/paletteCases";
import { GradientPreview } from "./GradientPreview";
import { EffectsPanel } from "./EffectsPanel";
import type { EffectState } from "../_types";
import { track } from "@/lib/analytics";

const DEFAULT_EFFECTS: EffectState = {
  tintOverlay: false,
  blobOverlay: false,
  grain: false,
  vignette: {
    enabled: false,
    strength: 0.35,
    radius: 0.6,
    softness: 0.5,
    mode: "darken",
  },
  patternGrid: false,
  blur: false,
};

export function PlaygroundPage() {
  const [effects, setEffects] = useState<EffectState>(DEFAULT_EFFECTS);

  useEffect(() => {
    track("playground_viewed", { mode: "dev" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 py-10 lg:flex-row">
        <main className="flex w-full flex-1 flex-col gap-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Background Playground
            </p>
            <h1 className="text-2xl font-semibold text-foreground">Background Playground</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Stable palettes flowing through the same generator + renderer used in production.
            </p>
          </header>

          <div className="flex flex-col gap-6">
            {paletteCases.map((palette) => (
              <GradientPreview key={palette.id} palette={palette} effects={effects} />
            ))}
          </div>
        </main>

        <div className="w-full max-w-full lg:max-w-[320px]">
          <EffectsPanel value={effects} onChange={setEffects} />
        </div>
      </div>
    </div>
  );
}
