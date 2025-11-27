"use client";

import { useState, useMemo, useCallback, useRef, useEffect, type ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { GRADIENTS, getGradientById } from "@/domain/layout/gradients";
import { BackgroundConfig, ColorToken, CustomGradient } from "@/domain/layout/types";
import { ColorPalette } from "@/domain/asset/types";
import { customGradientToCss, getContrastTextColor } from "@/domain/layout/gradient-utils";
import { cn } from "@/utils";
import { ChevronDown, Sparkles } from "lucide-react";

// Debounced color input that delays updates while dragging
function DebouncedColorInput({
  value,
  onChange,
  id,
  label,
  delay = 100,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  label: string;
  delay?: number;
}) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  };

  return (
    <div className="flex flex-1 items-center gap-2 rounded-md border border-border/50 bg-background px-2 py-1.5">
      <input
        type="color"
        id={id}
        value={localValue}
        onChange={handleChange}
        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={`${label} color`}
      />
      <label htmlFor={id} className="text-xs text-muted-foreground cursor-pointer">
        {label}
      </label>
    </div>
  );
}

interface GradientPickerProps {
  background: BackgroundConfig;
  colorPalette?: ColorPalette;
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
}

export function GradientPicker({ background, colorPalette, onChangeAction }: GradientPickerProps) {
  const [expanded, setExpanded] = useState(false);

  // Memoize current gradient CSS for display
  const currentGradientCss = useMemo((): string => {
    if (background.customGradient) {
      return customGradientToCss(background.customGradient);
    }
    if (background.type === "gradient" && background.value) {
      const preset = getGradientById(background.value);
      if (preset) return preset.value;
    }
    return "linear-gradient(to right, #6366f1, #8b5cf6)";
  }, [background.customGradient, background.type, background.value]);

  const handlePresetSelect = useCallback((gradientId: string) => {
    const gradient = getGradientById(gradientId);
    onChangeAction(
      { type: "gradient", value: gradientId, customGradient: undefined },
      gradient?.textColor ?? "slate-900",
    );
  }, [onChangeAction]);

  const handleCustomGradientSelect = useCallback((gradient: CustomGradient) => {
    const textColor = getContrastTextColor(gradient.from);
    onChangeAction({ type: "gradient", value: "custom", customGradient: gradient }, textColor);
  }, [onChangeAction]);

  const handleColorChange = useCallback((colorType: "from" | "to", value: string) => {
    const current = background.customGradient ?? {
      from: colorPalette?.accent ?? "#6366f1",
      to: "#ffffff",
      direction: "to right",
    };
    const newGradient = { ...current, [colorType]: value };
    const textColor = getContrastTextColor(newGradient.from);
    onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient }, textColor);
  }, [background.customGradient, colorPalette?.accent, onChangeAction]);

  // Memoize dynamic gradients from screenshot colors
  // Order: vibrant (LightVibrant) first as it's the preferred default for backgrounds,
  // then accent variants, then dominant-to-accent combination
  const dynamicGradients = useMemo((): CustomGradient[] => {
    if (!colorPalette) return [];
    const gradients: CustomGradient[] = [];
    
    // Vibrant (LightVibrant) to white - preferred default, most background-friendly
    if (colorPalette.vibrant) {
      gradients.push({ from: colorPalette.vibrant, to: "#ffffff", direction: "to right" });
    }
    // Accent (Vibrant) to white
    gradients.push({ from: colorPalette.accent, to: "#ffffff", direction: "to right" });
    // Accent to dark
    gradients.push({ from: colorPalette.accent, to: "#1e1e1e", direction: "to right" });
    // Dominant to accent - color combination
    gradients.push({ from: colorPalette.dominant, to: colorPalette.accent, direction: "to right" });
    
    return gradients;
  }, [colorPalette]);

  return (
    <div className="space-y-2">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
        aria-expanded={expanded}
        aria-label="Select gradient"
      >
        <div
          className="h-10 w-14 shrink-0 rounded border border-border"
          style={{ background: currentGradientCss }}
        />
        <div className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-xs font-medium text-foreground">
            {background.customGradient ? "Custom Gradient" : getGradientById(background.value)?.name ?? "Gradient"}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">Click to change</span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Collapsible content */}
      {expanded && (
        <div className="space-y-3 rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
          {/* Dynamic gradients from screenshot */}
          {dynamicGradients.length > 0 && (
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" aria-hidden="true" />
                  <Label className="text-xs font-medium text-foreground">From Screenshot</Label>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Curated gradients based on your image colors
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dynamicGradients.map((g, i) => {
                  const isSelected = background.customGradient &&
                    background.customGradient.from === g.from &&
                    background.customGradient.to === g.to;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Dynamic gradient from ${g.from} to ${g.to}`}
                      aria-pressed={!!isSelected}
                      className={cn(
                        "h-10 rounded-md border transition-all hover:opacity-90",
                        isSelected
                          ? "border-primary ring-1 ring-primary"
                          : "border-border/50",
                      )}
                      style={{ background: customGradientToCss(g) }}
                      onClick={() => handleCustomGradientSelect(g)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom color inputs */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Custom Colors</Label>
            <div className="flex gap-2">
              <DebouncedColorInput
                id="gradient-from-color"
                value={background.customGradient?.from ?? colorPalette?.accent ?? "#6366f1"}
                onChange={(value) => handleColorChange("from", value)}
                label="From"
              />
              <DebouncedColorInput
                id="gradient-to-color"
                value={background.customGradient?.to ?? "#ffffff"}
                onChange={(value) => handleColorChange("to", value)}
                label="To"
              />
            </div>
          </div>

          {/* Preset gradients */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Presets</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {GRADIENTS.map((g) => {
                const isSelected = background.type === "gradient" &&
                  background.value === g.id &&
                  !background.customGradient;
                return (
                  <button
                    key={g.id}
                    type="button"
                    aria-label={`${g.name} gradient preset`}
                    aria-pressed={isSelected}
                    className={cn(
                      "h-8 rounded border transition-all hover:opacity-90",
                      isSelected
                        ? "border-primary ring-1 ring-primary"
                        : "border-border/50",
                    )}
                    style={{ background: g.value }}
                    onClick={() => handlePresetSelect(g.id)}
                    title={g.name}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

