"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { EffectState, VignetteMode } from "../_types";
import { track } from "@/lib/analytics";

type EffectKey = keyof EffectState;

type EffectItem = {
  key: EffectKey;
  label: string;
};

const EFFECT_ITEMS: EffectItem[] = [
  { key: "tintOverlay", label: "Tint overlay" },
  { key: "blobOverlay", label: "Blob overlay" },
  { key: "grain", label: "Grain" },
  { key: "vignette", label: "Vignette" },
  { key: "patternGrid", label: "Pattern/grid" },
  { key: "blur", label: "Blur" },
];

const VIGNETTE_MODE_OPTIONS = [
  { id: "darken", label: "Darken" },
  { id: "lighten", label: "Lighten" },
];

const SLIDER_CLASSNAME = [
  "h-1.5 w-full cursor-pointer appearance-none rounded-full",
  "bg-border transition-colors",
  "hover:bg-muted-foreground/30",
  "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:bg-foreground/70 [&::-webkit-slider-thumb]:transition-colors",
  "[&::-webkit-slider-thumb]:hover:bg-foreground",
  "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5",
  "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground/70",
  "[&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:hover:bg-foreground",
].join(" ");

const formatValue = (value: number) => value.toFixed(2);

interface EffectsPanelProps {
  value: EffectState;
  onChange: (next: EffectState) => void;
}

export function EffectsPanel({ value, onChange }: EffectsPanelProps) {
  const updateVignette = (updates: Partial<EffectState["vignette"]>) => {
    const next = {
      ...value,
      vignette: {
        ...value.vignette,
        ...updates,
      },
    };
    onChange(next);
  };

  const handleToggle = (key: EffectKey, enabled: boolean) => {
    if (key === "vignette") {
      updateVignette({ enabled });
    } else {
      const next = { ...value, [key]: enabled };
      onChange(next);
    }
    track("playground_effect_toggled", { effect: key, enabled });
  };

  const handleVignetteValue = (field: keyof EffectState["vignette"], value: number) => {
    updateVignette({ [field]: value } as Partial<EffectState["vignette"]>);
    track("playground_vignette_updated", { field, value });
  };

  const handleVignetteMode = (mode: VignetteMode) => {
    updateVignette({ mode });
    track("playground_vignette_updated", { field: "mode", value: mode });
  };

  return (
    <aside className="flex h-fit w-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Effects (WIP)
        </p>
        <h2 className="text-lg font-semibold text-foreground">Effects (WIP)</h2>
      </div>

      <div className="flex flex-col gap-3">
        {EFFECT_ITEMS.map((item) => {
          const id = `effect-${item.key}`;
          const isVignette = item.key === "vignette";
          const isChecked = isVignette ? value.vignette.enabled : (value[item.key] as boolean);
          return (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={id} className="text-sm font-medium text-foreground">
                {item.label}
              </Label>
              <Switch
                id={id}
                checked={isChecked}
                onCheckedChange={(next) => handleToggle(item.key, next)}
              />
            </div>
          );
        })}
      </div>

      {value.vignette.enabled ? (
        <div className="rounded-xl border border-border/40 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Vignette Controls
          </p>
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Strength</span>
                <span>{formatValue(value.vignette.strength)}</span>
              </div>
              <input
                aria-label="Vignette strength"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.vignette.strength}
                onChange={(event) =>
                  handleVignetteValue("strength", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Radius</span>
                <span>{formatValue(value.vignette.radius)}</span>
              </div>
              <input
                aria-label="Vignette radius"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.vignette.radius}
                onChange={(event) =>
                  handleVignetteValue("radius", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Softness</span>
                <span>{formatValue(value.vignette.softness)}</span>
              </div>
              <input
                aria-label="Vignette softness"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.vignette.softness}
                onChange={(event) =>
                  handleVignetteValue("softness", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Mode
              </Label>
              <SegmentedControl
                value={value.vignette.mode}
                options={VIGNETTE_MODE_OPTIONS}
                ariaLabel="Vignette mode"
                onChange={(next) => handleVignetteMode(next as VignetteMode)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border/40 bg-background/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          State JSON
        </p>
        <pre className="mt-2 text-xs text-muted-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </aside>
  );
}
