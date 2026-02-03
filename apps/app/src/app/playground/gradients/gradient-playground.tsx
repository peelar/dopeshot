"use client";

import { useMemo, useState } from "react";
import {
  AccentStrength,
  Brightness,
  ColorSignature,
  HueBucket,
  buildGradientPalette,
  customGradientToCss,
  generateGradientOptions,
} from "@/domain/layout/gradients";
import { cn } from "@/lib/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterValue<T extends string> = T | "all";

const HUE_BUCKETS: HueBucket[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "neutral",
];

const BRIGHTNESS: Brightness[] = ["light", "medium", "dark"];
const STRENGTH: AccentStrength[] = ["vibrant", "muted", "grayscale"];

const HUE_ANCHORS: Record<HueBucket, number> = {
  red: 350,
  orange: 30,
  yellow: 60,
  green: 130,
  teal: 180,
  blue: 220,
  purple: 275,
  pink: 315,
  neutral: 0,
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function GradientPlayground() {
  const [hueFilter, setHueFilter] = useState<FilterValue<HueBucket>>("all");
  const [brightnessFilter, setBrightnessFilter] = useState<FilterValue<Brightness>>("all");
  const [strengthFilter, setStrengthFilter] = useState<FilterValue<AccentStrength>>("all");

  const signatureGroups = useMemo(() => {
    const hues = hueFilter === "all" ? HUE_BUCKETS : [hueFilter];
    const brightnesses = brightnessFilter === "all" ? BRIGHTNESS : [brightnessFilter];
    const strengths = strengthFilter === "all" ? STRENGTH : [strengthFilter];

    const groups: Array<{
      key: string;
      signature: ColorSignature;
      label: string;
      palette: ReturnType<typeof buildGradientPalette>;
      gradients: ReturnType<typeof generateGradientOptions>;
    }> = [];

    for (const hue of hues) {
      for (const brightness of brightnesses) {
        for (const strength of strengths) {
          const signature: ColorSignature = {
            dominantHue: hue,
            dominantHueAngle: HUE_ANCHORS[hue],
            brightness,
            accentStrength: strength,
            dominantColor: "#000000",
            accentColor: "#ffffff",
          };
          const palette = buildGradientPalette(signature);
          const gradients = generateGradientOptions(signature);
          const label = `${titleCase(hue)} · ${titleCase(brightness)} · ${titleCase(strength)}`;

          groups.push({
            key: `${hue}-${brightness}-${strength}`,
            signature,
            label,
            palette,
            gradients,
          });
        }
      }
    }

    return groups;
  }, [brightnessFilter, hueFilter, strengthFilter]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-6 py-10 text-foreground dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Gradient Playground</h1>
          <p className="text-sm text-muted-foreground">
            Curated palette-matched gradients across hue, brightness, and strength buckets.
          </p>
        </header>

        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm">
          <FilterSelect
            label="Hue"
            value={hueFilter}
            onChange={setHueFilter}
            options={HUE_BUCKETS}
          />
          <FilterSelect
            label="Brightness"
            value={brightnessFilter}
            onChange={setBrightnessFilter}
            options={BRIGHTNESS}
          />
          <FilterSelect
            label="Strength"
            value={strengthFilter}
            onChange={setStrengthFilter}
            options={STRENGTH}
          />
          <div className="ml-auto text-xs text-muted-foreground">
            {signatureGroups.length} sets · {signatureGroups.length * 6} gradients
          </div>
        </section>

        <section className="flex flex-col gap-6">
          {signatureGroups.map((group) => (
            <div
              key={group.key}
              className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold">{group.label}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ColorChip color={group.palette.colors.primary} label="P" />
                  <ColorChip color={group.palette.colors.secondary} label="S" />
                  <ColorChip color={group.palette.colors.tertiary} label="T" />
                  <ColorChip color={group.palette.colors.glow} label="G" />
                  <ColorChip color={group.palette.colors.neutral} label="N" />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {group.gradients.map((gradient, index) => {
                  const css = customGradientToCss(gradient);
                  return (
                    <div
                      key={`${group.key}-${index}`}
                      className={cn(
                        "relative h-20 w-full overflow-hidden rounded-lg border border-white/10 shadow-sm",
                        "ring-1 ring-black/5 dark:ring-white/5",
                      )}
                      style={{ background: css }}
                    >
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                        {index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: FilterValue<T>;
  onChange: (value: FilterValue<T>) => void;
  options: T[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as FilterValue<T>)}>
        <SelectTrigger className="min-w-[140px]">
          <SelectValue placeholder={`All ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {titleCase(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide">
      <span className="h-3 w-3 rounded-full border border-white/40" style={{ background: color }} />
      {label}
    </span>
  );
}
