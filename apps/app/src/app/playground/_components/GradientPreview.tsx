"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createScreenshotColorSource } from "@/domain/layout/gradients/color-source";
import { applyPreferredAngle } from "@/domain/layout/gradient-application";
import { customGradientToCss, generateGradientOptions } from "@/domain/layout/gradients";
import type { EffectState, GeneratedGradient, PaletteInput } from "../_types";
import { track } from "@/lib/analytics";
import { buildVignetteGradient } from "../_lib/vignette";

const PREFERRED_ANGLE = 135;

function buildGradient(palette: PaletteInput): GeneratedGradient {
  const options = generateGradientOptions(palette.colors, {
    aspectCategory: "landscape",
  });
  const fallback = {
    from: palette.colors.dominant,
    to: palette.colors.accent,
  };
  const selected = options[0] ?? fallback;
  const gradient = applyPreferredAngle(selected, PREFERRED_ANGLE);
  const css = customGradientToCss(gradient);

  return {
    palette,
    gradient,
    css,
  };
}

interface GradientPreviewProps {
  palette: PaletteInput;
  effects: EffectState;
}

export function GradientPreview({ palette, effects }: GradientPreviewProps) {
  const [generated, setGenerated] = useState(() => buildGradient(palette));
  const colorSource = useMemo(
    () => createScreenshotColorSource(`palette-${palette.id}`, palette.colors),
    [palette]
  );

  const debugPayload = useMemo(
    () => ({
      palette,
      colorSource,
      gradient: generated.gradient,
      gradientCss: generated.css,
      effects,
    }),
    [colorSource, effects, generated.css, generated.gradient, palette]
  );
  const debugJson = useMemo(() => JSON.stringify(debugPayload, null, 2), [debugPayload]);

  const handleRecompute = () => {
    const next = buildGradient(palette);
    setGenerated(next);
    track("playground_gradient_recomputed", { paletteId: palette.id });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(debugJson);
      track("playground_debug_copied", { paletteId: palette.id });
    } catch (error) {
      console.warn("Failed to copy debug JSON", error);
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {palette.title}
          </p>
          <h2 className="text-lg font-semibold text-foreground">{palette.description}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleRecompute}>
            Recompute
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            Copy debug JSON
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div
          className="relative h-[450px] w-full max-w-[800px] overflow-hidden rounded-2xl border border-border/60 shadow-sm"
          style={{ background: generated.css }}
          aria-label={`${palette.title} gradient preview`}
        >
          {effects.vignette.enabled ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: buildVignetteGradient(effects.vignette) }}
              aria-hidden="true"
            />
          ) : null}
        </div>

        <details className="group rounded-xl border border-border/40 bg-background/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Debug JSON
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            {debugJson}
          </pre>
        </details>
      </div>
    </section>
  );
}
