"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { GRADIENTS, getGradientById } from "@/domain/layout/gradients";
import { BackgroundConfig, ColorToken, CustomGradient } from "@/domain/layout/types";
import { ColorPalette } from "@/domain/asset/types";
import { customGradientToCss, getContrastTextColor } from "@/domain/layout/gradient-utils";
import { cn } from "@/utils";
import { ChevronDown, Sparkles } from "lucide-react";

interface GradientPickerProps {
  background: BackgroundConfig;
  colorPalette?: ColorPalette;
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
}

export function GradientPicker({ background, colorPalette, onChangeAction }: GradientPickerProps) {
  const [expanded, setExpanded] = useState(false);

  // Get current gradient CSS for display
  const getCurrentGradientCss = (): string => {
    if (background.customGradient) {
      return customGradientToCss(background.customGradient);
    }
    if (background.type === "gradient" && background.value) {
      const preset = getGradientById(background.value);
      if (preset) return preset.value;
    }
    return "linear-gradient(to right, #6366f1, #8b5cf6)";
  };

  const handlePresetSelect = (gradientId: string) => {
    const gradient = getGradientById(gradientId);
    onChangeAction(
      { type: "gradient", value: gradientId, customGradient: undefined },
      gradient?.textColor ?? "slate-900",
    );
  };

  const handleCustomGradientSelect = (gradient: CustomGradient) => {
    const textColor = getContrastTextColor(gradient.from);
    onChangeAction({ type: "gradient", value: "custom", customGradient: gradient }, textColor);
  };

  const handleColorChange = (colorType: "from" | "to", value: string) => {
    const current = background.customGradient ?? {
      from: colorPalette?.accent ?? "#6366f1",
      to: "#ffffff",
      direction: "to right",
    };
    const newGradient = { ...current, [colorType]: value };
    const textColor = getContrastTextColor(newGradient.from);
    onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient }, textColor);
  };

  // Generate dynamic gradients from screenshot colors
  const dynamicGradients: CustomGradient[] = colorPalette
    ? [
        { from: colorPalette.accent, to: "#ffffff", direction: "to right" },
        { from: colorPalette.accent, to: "#1e1e1e", direction: "to right" },
        { from: colorPalette.dominant, to: colorPalette.accent, direction: "to right" },
        ...(colorPalette.vibrant
          ? [{ from: colorPalette.vibrant, to: "#ffffff", direction: "to right" }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-2">
      {/* Trigger */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
        aria-expanded={expanded}
        aria-label="Select gradient"
      >
        <div
          className="h-10 w-14 shrink-0 rounded border border-border"
          style={{ background: getCurrentGradientCss() }}
        />
        <div className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-xs font-medium text-foreground">
            {background.customGradient ? "Custom Gradient" : getGradientById(background.value)?.name ?? "Gradient"}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">Click to change</span>
        </div>
        <ChevronDown
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
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <Label className="text-xs font-medium text-foreground">From Screenshot</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dynamicGradients.map((g, i) => (
                  <button
                    key={i}
                    className={cn(
                      "h-10 rounded-md border transition-all hover:opacity-90",
                      background.customGradient &&
                        background.customGradient.from === g.from &&
                        background.customGradient.to === g.to
                        ? "border-primary ring-1 ring-primary"
                        : "border-border/50",
                    )}
                    style={{ background: customGradientToCss(g) }}
                    onClick={() => handleCustomGradientSelect(g)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom color inputs */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Custom Colors</Label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-border/50 bg-background px-2 py-1.5">
                <input
                  type="color"
                  value={background.customGradient?.from ?? colorPalette?.accent ?? "#6366f1"}
                  onChange={(e) => handleColorChange("from", e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="text-xs text-muted-foreground">From</span>
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-md border border-border/50 bg-background px-2 py-1.5">
                <input
                  type="color"
                  value={background.customGradient?.to ?? "#ffffff"}
                  onChange={(e) => handleColorChange("to", e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="text-xs text-muted-foreground">To</span>
              </div>
            </div>
          </div>

          {/* Preset gradients */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Presets</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  className={cn(
                    "h-8 rounded border transition-all hover:opacity-90",
                    background.type === "gradient" &&
                      background.value === g.id &&
                      !background.customGradient
                      ? "border-primary ring-1 ring-primary"
                      : "border-border/50",
                  )}
                  style={{ background: g.value }}
                  onClick={() => handlePresetSelect(g.id)}
                  title={g.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

