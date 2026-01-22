"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BlobBlendMode,
  BlobPlacement,
  EffectState,
  GrainBlendMode,
  VignetteMode,
} from "../_types";
import { track } from "@/lib/analytics";

type EffectKey = keyof EffectState;

type EffectItem = {
  key: EffectKey;
  label: string;
  disabled?: boolean;
};

const EFFECT_ITEMS: EffectItem[] = [
  { key: "tintOverlay", label: "Tint overlay", disabled: true },
  { key: "blobOverlay", label: "Blobs" },
  { key: "grain", label: "Grain" },
  { key: "vignette", label: "Vignette" },
  { key: "patternGrid", label: "Pattern/grid", disabled: true },
  { key: "blur", label: "Blur", disabled: true },
];

const VIGNETTE_MODE_OPTIONS = [
  { id: "darken", label: "Darken" },
  { id: "lighten", label: "Lighten" },
];

const GRAIN_BLEND_OPTIONS = [
  { id: "soft-light", label: "Soft light" },
  { id: "overlay", label: "Overlay" },
  { id: "multiply", label: "Multiply" },
  { id: "normal", label: "Normal" },
] as const;

const BLOB_BLEND_OPTIONS = [
  { id: "screen", label: "Screen" },
  { id: "soft-light", label: "Soft light" },
  { id: "overlay", label: "Overlay" },
  { id: "normal", label: "Normal" },
] as const;

const BLOB_PLACEMENT_OPTIONS = [
  { id: "diagonal", label: "Diagonal" },
  { id: "corners", label: "Corners" },
  { id: "randomBalanced", label: "Random balanced" },
] as const;

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
const formatSeed = (value: number) => value.toString();

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

  const updateGrain = (updates: Partial<EffectState["grain"]>) => {
    const next = {
      ...value,
      grain: {
        ...value.grain,
        ...updates,
      },
    };
    onChange(next);
  };

  const handleToggle = (key: EffectKey, enabled: boolean) => {
    if (key === "vignette") {
      updateVignette({ enabled });
    } else if (key === "grain") {
      updateGrain({ enabled });
    } else if (key === "blobOverlay") {
      updateBlobOverlay({ enabled });
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

  const handleBlobSeed = (nextValue: number) => {
    const seed = Math.max(0, Math.floor(nextValue));
    updateBlobOverlay({ seed });
    track("playground_blob_updated", { field: "seed", value: seed });
  };

  const updateBlobOverlay = (updates: Partial<EffectState["blobOverlay"]>) => {
    const next = {
      ...value,
      blobOverlay: {
        ...value.blobOverlay,
        ...updates,
      },
    };
    onChange(next);
  };

  const handleGrainValue = (
    field: keyof EffectState["grain"],
    nextValue: number | boolean | GrainBlendMode,
  ) => {
    updateGrain({ [field]: nextValue } as Partial<EffectState["grain"]>);
    track("playground_grain_updated", { field, value: nextValue });
  };

  const handleBlobValue = (
    field: keyof EffectState["blobOverlay"],
    nextValue: number | BlobBlendMode | BlobPlacement,
  ) => {
    updateBlobOverlay({ [field]: nextValue } as Partial<EffectState["blobOverlay"]>);
    track("playground_blob_updated", { field, value: nextValue });
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
          const isGrain = item.key === "grain";
          const isChecked = isVignette
            ? value.vignette.enabled
            : isGrain
              ? value.grain.enabled
              : item.key === "blobOverlay"
                ? value.blobOverlay.enabled
                : (value[item.key] as boolean);
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4"
            >
              <Label
                htmlFor={id}
                className={
                  item.disabled
                    ? "text-sm font-medium text-muted-foreground"
                    : "text-sm font-medium text-foreground"
                }
              >
                {item.label}
              </Label>
              <Switch
                id={id}
                checked={isChecked}
                onCheckedChange={(next) => handleToggle(item.key, next)}
                disabled={item.disabled}
                aria-disabled={item.disabled}
              />
            </div>
          );
        })}
      </div>

      {value.blobOverlay.enabled ? (
        <div className="rounded-xl border border-border/40 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Blob Controls
          </p>
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Count</span>
                <span>{value.blobOverlay.count}</span>
              </div>
              <input
                aria-label="Blob count"
                type="range"
                min={1}
                max={3}
                step={1}
                value={value.blobOverlay.count}
                onChange={(event) =>
                  handleBlobValue("count", Number.parseInt(event.target.value, 10))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Strength</span>
                <span>{formatValue(value.blobOverlay.strength)}</span>
              </div>
              <input
                aria-label="Blob strength"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.blobOverlay.strength}
                onChange={(event) =>
                  handleBlobValue("strength", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Softness</span>
                <span>{formatValue(value.blobOverlay.softness)}</span>
              </div>
              <input
                aria-label="Blob softness"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.blobOverlay.softness}
                onChange={(event) =>
                  handleBlobValue("softness", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Scale</span>
                <span>{formatValue(value.blobOverlay.scale)}</span>
              </div>
              <input
                aria-label="Blob scale"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.blobOverlay.scale}
                onChange={(event) =>
                  handleBlobValue("scale", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Blend mode
              </Label>
              <Select
                value={value.blobOverlay.blendMode}
                onValueChange={(next) => handleBlobValue("blendMode", next as BlobBlendMode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{value.blobOverlay.blendMode}</SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-40">
                  {BLOB_BLEND_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="py-2">
                      <span className="text-sm font-medium">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Placement
              </Label>
              <Select
                value={value.blobOverlay.placement}
                onValueChange={(next) => handleBlobValue("placement", next as BlobPlacement)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{value.blobOverlay.placement}</SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-40">
                  {BLOB_PLACEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="py-2">
                      <span className="text-sm font-medium">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <Label
                  htmlFor="blob-seed"
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Seed
                </Label>
                <span>{formatSeed(value.blobOverlay.seed)}</span>
              </div>
              <Input
                id="blob-seed"
                type="number"
                min={0}
                step={1}
                value={value.blobOverlay.seed}
                onChange={(event) => handleBlobSeed(Number.parseFloat(event.target.value || "0"))}
              />
            </div>
          </div>
        </div>
      ) : null}

      {value.grain.enabled ? (
        <div className="rounded-xl border border-border/40 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Grain Controls
          </p>
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Amount</span>
                <span>{formatValue(value.grain.amount)}</span>
              </div>
              <input
                aria-label="Grain amount"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.grain.amount}
                onChange={(event) =>
                  handleGrainValue("amount", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Scale</span>
                <span>{formatValue(value.grain.scale)}</span>
              </div>
              <input
                aria-label="Grain scale"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.grain.scale}
                onChange={(event) =>
                  handleGrainValue("scale", Number.parseFloat(event.target.value))
                }
                className={SLIDER_CLASSNAME}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Blend mode
              </Label>
              <Select
                value={value.grain.blendMode}
                onValueChange={(next) => handleGrainValue("blendMode", next as GrainBlendMode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{value.grain.blendMode}</SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-40">
                  {GRAIN_BLEND_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="py-2">
                      <span className="text-sm font-medium">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <Label
                  htmlFor="grain-seed"
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Seed
                </Label>
                <span>{value.grain.useSeed ? formatSeed(value.grain.seed) : "—"}</span>
              </div>
              <Input
                id="grain-seed"
                type="number"
                min={0}
                step={1}
                value={value.grain.seed}
                onChange={(event) =>
                  handleGrainValue(
                    "seed",
                    Math.max(
                      0,
                      Math.floor(Number.parseFloat(event.target.value || "0"))
                    )
                  )
                }
                className={!value.grain.useSeed ? "opacity-60" : undefined}
                disabled={!value.grain.useSeed}
              />
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="grain-use-seed"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Use seed
                </Label>
                <Switch
                  id="grain-use-seed"
                  checked={value.grain.useSeed}
                  onCheckedChange={(next) => handleGrainValue("useSeed", next)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
