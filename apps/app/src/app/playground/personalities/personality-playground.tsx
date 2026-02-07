"use client";

import { useMemo } from "react";

import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { ScanlinesOverlay } from "@/components/layouts/shared/ScanlinesOverlay";
import { buildShadowFromStyle } from "@/components/layouts/shared/shadows";
import { personalityStyles } from "@/domain/brand/personality-mapping";
import { getFontStyleDefinition, getFontStyleCssValue } from "@/domain/layout/fonts";
import { type BrandPersonality, brandPersonalityLabels, brandPersonalityValues } from "@/lib/types/brand";
import { cn } from "@/lib/utils/cn";

const previewCopy: Record<BrandPersonality, { title: string; subtitle: string; badge: string }> = {
  founder: {
    title: "Build with clarity",
    subtitle: "Crisp layouts and confident typography keep things focused.",
    badge: "Precision",
  },
  hipster: {
    title: "Handcrafted energy",
    subtitle: "Warm, tactile details bring personality into the UI.",
    badge: "Warmth",
  },
  hacker: {
    title: "Ship in the terminal",
    subtitle: "Minimal, technical styling with an edge of utility.",
    badge: "Signal",
  },
  kawaii: {
    title: "Soft launch",
    subtitle: "Rounded shapes and cozy type create welcoming vibes.",
    badge: "Joy",
  },
};

const previewBackgrounds: Record<BrandPersonality, string> = {
  founder: "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(236, 241, 255, 0.92))",
  hipster: "linear-gradient(135deg, rgba(255, 241, 226, 0.96), rgba(255, 214, 183, 0.9))",
  hacker: "linear-gradient(135deg, rgba(8, 16, 22, 0.96), rgba(21, 32, 40, 0.92))",
  kawaii: "linear-gradient(135deg, rgba(255, 237, 244, 0.96), rgba(255, 206, 231, 0.9))",
};

const previewTextClasses: Record<BrandPersonality, string> = {
  founder: "text-slate-900",
  hipster: "text-amber-950",
  hacker: "text-emerald-200",
  kawaii: "text-pink-900",
};

const previewBadgeClasses: Record<BrandPersonality, string> = {
  founder: "bg-slate-900/5 text-slate-700",
  hipster: "bg-amber-900/10 text-amber-900",
  hacker: "bg-emerald-400/10 text-emerald-200",
  kawaii: "bg-pink-900/10 text-pink-900",
};

function PreviewCard({ personality }: { personality: BrandPersonality }) {
  const styleTokens = personalityStyles[personality];
  const font = getFontStyleDefinition(styleTokens.fontStyle);
  const shadow = buildShadowFromStyle(styleTokens.shadow);
  const textClasses = previewTextClasses[personality];
  const preview = previewCopy[personality];
  const cardStyle = useMemo(
    () => ({
      borderRadius: styleTokens.cornerRadius,
      boxShadow: shadow !== "none" ? shadow : undefined,
      background: previewBackgrounds[personality],
      fontFamily: getFontStyleCssValue(styleTokens.fontStyle),
    }),
    [personality, shadow, styleTokens.cornerRadius, styleTokens.fontStyle],
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        className={cn(
          "relative overflow-hidden border border-white/10 p-6",
          personality === "hacker" ? "border-emerald-500/30" : "border-slate-200",
        )}
        style={cardStyle}
      >
        {styleTokens.texture === "grain" ? (
          <GrainOverlay enabled intensity={styleTokens.textureIntensity ?? 0.5} />
        ) : null}
        {styleTokens.texture === "scanlines" ? (
          <ScanlinesOverlay enabled intensity={styleTokens.textureIntensity ?? 0.3} />
        ) : null}
        <div className={cn("relative z-10 flex flex-col gap-3", textClasses)}>
          <span
            className={cn(
              "w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              previewBadgeClasses[personality],
            )}
          >
            {preview.badge}
          </span>
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold">{preview.title}</h3>
            <p className="text-sm/6 opacity-80">{preview.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
          <span>Tokens</span>
          <span>{font.fontName}</span>
        </div>
        <ul className="space-y-1 rounded-lg border border-muted bg-muted/30 p-3 text-xs">
          <li className="flex items-center justify-between">
            <span>Corner radius</span>
            <span>{styleTokens.cornerRadius}px</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Shadow</span>
            <span>{shadow === "none" ? "None" : "Custom"}</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Texture</span>
            <span>{styleTokens.texture === "none" ? "None" : styleTokens.texture}</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Font style</span>
            <span>{font.name}</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Foundry</span>
            <span>{font.foundry}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function PersonalityPlayground() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Dev Playground
        </p>
        <h1 className="text-3xl font-semibold">Personality Preview</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Quick visual reference for the personality-driven tokens that shape typography, textures,
          and component styling.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {brandPersonalityValues.map((personality) => (
          <section key={personality} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{brandPersonalityLabels[personality]}</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {personality}
              </span>
            </div>
            <PreviewCard personality={personality} />
          </section>
        ))}
      </div>
    </div>
  );
}
