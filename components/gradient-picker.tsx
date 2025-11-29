"use client";

import { useState, useMemo, useCallback, useRef, useEffect, type ChangeEvent } from "react";
import { GRADIENTS, getGradientById } from "@/domain/layout/gradients";
import { BackgroundConfig, ColorToken, CustomGradient } from "@/domain/layout/types";
import { ColorPalette } from "@/domain/asset/types";
import {
  customGradientToCss,
  getContrastTextColor,
  directionStringToDegrees,
  degreesToDirection,
} from "@/domain/layout/gradient-utils";
import { cn } from "@/utils";
import { SegmentedControl } from "@/components/ui/segmented-control";

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
    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/30 bg-background/60 px-2 py-1">
      <input
        type="color"
        id={id}
        value={localValue}
        onChange={handleChange}
        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={`${label} color`}
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground"
      >
        {label}
      </label>
    </div>
  );
}

type GradientSource = "screenshot" | "custom" | "preset";

interface GradientPickerProps {
  background: BackgroundConfig;
  colorPalette?: ColorPalette;
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
}

export function GradientPicker({ background, colorPalette, onChangeAction }: GradientPickerProps) {
  const dynamicGradients = useMemo((): CustomGradient[] => {
    if (!colorPalette) return [];
    const gradients: CustomGradient[] = [];

    if (colorPalette.vibrant) {
      gradients.push({ from: colorPalette.vibrant, to: "#ffffff", direction: "to right" });
    }
    gradients.push({ from: colorPalette.accent, to: "#ffffff", direction: "to right" });
    gradients.push({ from: colorPalette.accent, to: "#1e1e1e", direction: "to right" });
    gradients.push({ from: colorPalette.dominant, to: colorPalette.accent, direction: "to right" });

    return gradients;
  }, [colorPalette]);

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

  const currentAngle = useMemo(
    () => directionStringToDegrees(background.customGradient?.direction),
    [background.customGradient?.direction],
  );

  const defaultSource = useMemo<GradientSource>(() => {
    if (
      background.type === "gradient" &&
      background.value &&
      background.value !== "custom" &&
      !background.customGradient
    ) {
      return "preset";
    }
    if (dynamicGradients.length > 0) {
      return "screenshot";
    }
    return "custom";
  }, [
    background.type,
    background.value,
    background.customGradient?.from,
    background.customGradient?.to,
    background.customGradient?.direction,
    dynamicGradients.length,
  ]);

  const [activeSource, setActiveSource] = useState<GradientSource>(() => defaultSource);
  const sourceOverrideRef = useRef(false);
  const lockManualSource = useCallback(() => {
    sourceOverrideRef.current = true;
  }, []);
  const setActiveSourceWithOverride = useCallback(
    (source: GradientSource) => {
      lockManualSource();
      setActiveSource(source);
    },
    [lockManualSource],
  );

  useEffect(() => {
    if (sourceOverrideRef.current) {
      sourceOverrideRef.current = false;
      return;
    }
    if (defaultSource !== activeSource) {
      setActiveSource(defaultSource);
    }
  }, [defaultSource, activeSource]);

  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const currentTextColor = useMemo<ColorToken>(() => {
    if (background.customGradient) {
      return getContrastTextColor(background.customGradient.from);
    }
    if (background.type === "gradient" && background.value) {
      return getGradientById(background.value)?.textColor ?? "slate-900";
    }
    return "slate-900";
  }, [background.customGradient, background.type, background.value]);

  const hasScreenshotGradients = dynamicGradients.length > 0;
  const activePresetId =
    background.type === "gradient" && !background.customGradient ? background.value : undefined;

  const handlePresetSelect = useCallback(
    (gradientId: string) => {
      const gradient = getGradientById(gradientId);
      if (!gradient) return;
      setActiveSourceWithOverride("preset");
      onChangeAction(
        { type: "gradient", value: gradientId, customGradient: undefined },
        gradient.textColor ?? "slate-900",
      );
    },
    [onChangeAction, setActiveSourceWithOverride],
  );

  const handleCustomGradientSelect = useCallback(
    (gradient: CustomGradient) => {
      lockManualSource();
      const textColor = getContrastTextColor(gradient.from);
      onChangeAction({ type: "gradient", value: "custom", customGradient: gradient }, textColor);
    },
    [lockManualSource, onChangeAction],
  );

  const handleColorChange = useCallback(
    (colorType: "from" | "to", value: string) => {
      const current = background.customGradient ?? {
        from: colorPalette?.accent ?? "#6366f1",
        to: "#ffffff",
        direction: degreesToDirection(currentAngle),
      };
      const newGradient: CustomGradient = {
        ...current,
        direction: current.direction ?? degreesToDirection(currentAngle),
        [colorType]: value,
      };
      lockManualSource();
      const textColor = getContrastTextColor(newGradient.from);
      onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient }, textColor);
    },
    [
      background.customGradient,
      colorPalette?.accent,
      currentAngle,
      lockManualSource,
      onChangeAction,
    ],
  );

  const handleDirectionChange = useCallback(
    (angle: number) => {
      const current = background.customGradient ?? {
        from: colorPalette?.accent ?? "#6366f1",
        to: "#ffffff",
        direction: degreesToDirection(currentAngle),
      };
      const newGradient: CustomGradient = {
        ...current,
        direction: degreesToDirection(angle),
      };
      lockManualSource();
      const textColor = getContrastTextColor(newGradient.from);
      onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient }, textColor);
    },
    [
      background.customGradient,
      colorPalette?.accent,
      currentAngle,
      lockManualSource,
      onChangeAction,
    ],
  );

  const handleScreenshotSelect = useCallback(
    (gradient: CustomGradient) => {
      setActiveSourceWithOverride("screenshot");
      handleCustomGradientSelect(gradient);
    },
    [handleCustomGradientSelect, setActiveSourceWithOverride],
  );

  const gradientTabs = [
    { id: "screenshot", label: "From Screenshot", disabled: !hasScreenshotGradients },
    { id: "custom", label: "Custom" },
    { id: "preset", label: "Presets" },
  ] satisfies { id: GradientSource; label: string; disabled?: boolean }[];

  const handleTabChange = useCallback(
    (next: string) => {
      if (next === "screenshot" || next === "custom" || next === "preset") {
        setActiveSourceWithOverride(next);
      }
    },
    [setActiveSourceWithOverride],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-muted/30">
        <div className="space-y-3 border-b border-border/40 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Gradient
          </p>
          <SegmentedControl
            value={activeSource}
            options={gradientTabs}
            onChange={handleTabChange}
            ariaLabel="Select gradient source"
          />
        </div>
        <div className="px-4 py-4">
          {activeSource === "screenshot" && (
            <ScreenshotGradients
              gradients={dynamicGradients}
              activeGradient={background.customGradient}
              disabled={!hasScreenshotGradients}
              onSelect={handleScreenshotSelect}
            />
          )}
          {activeSource === "custom" && (
            <CustomGradientControls
              background={background}
              colorPalette={colorPalette}
              angle={currentAngle}
              onColorChange={handleColorChange}
              onAngleChange={handleDirectionChange}
            />
          )}
          {activeSource === "preset" && (
            <PresetGradients
              gradients={GRADIENTS}
              selectedPresetId={activePresetId}
              onSelect={handlePresetSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface ScreenshotGradientsProps {
  gradients: CustomGradient[];
  activeGradient?: CustomGradient;
  disabled: boolean;
  onSelect: (gradient: CustomGradient) => void;
}

function ScreenshotGradients({
  gradients,
  activeGradient,
  disabled,
  onSelect,
}: ScreenshotGradientsProps) {
  if (!gradients.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
        Upload a screenshot to reveal curated gradients.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        Sampled from your screenshot
      </p>
      <div className="grid grid-cols-4 gap-3">
        {gradients.map((gradient, index) => {
          const isSelected = areGradientsEqual(activeGradient, gradient);
          return (
            <GradientSwatch
              key={`${gradient.from}-${gradient.to}-${index}`}
              gradientCss={customGradientToCss(gradient)}
              selected={isSelected}
              onClick={() => !disabled && onSelect(gradient)}
              ariaLabel={`Gradient from ${gradient.from} to ${gradient.to}`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CustomGradientControlsProps {
  background: BackgroundConfig;
  colorPalette?: ColorPalette;
  angle: number;
  onColorChange: (colorType: "from" | "to", value: string) => void;
  onAngleChange: (angle: number) => void;
}

function CustomGradientControls({
  background,
  colorPalette,
  angle,
  onColorChange,
  onAngleChange,
}: CustomGradientControlsProps) {
  const fromValue = background.customGradient?.from ?? colorPalette?.accent ?? "#6366f1";
  const toValue = background.customGradient?.to ?? "#ffffff";

  return (
    <div className="space-y-3 rounded-2xl border border-border/20 bg-background/70 p-3">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Colors
        </div>
        <div className="flex gap-2">
          <DebouncedColorInput
            id="gradient-from-color"
            value={fromValue}
            onChange={(value) => onColorChange("from", value)}
            label="From"
          />
          <DebouncedColorInput
            id="gradient-to-color"
            value={toValue}
            onChange={(value) => onColorChange("to", value)}
            label="To"
          />
        </div>
      </div>
      <GradientAngleControl angle={angle} onChange={onAngleChange} />
    </div>
  );
}

interface PresetGradientsProps {
  gradients: typeof GRADIENTS;
  selectedPresetId?: string;
  onSelect: (gradientId: string) => void;
}

function PresetGradients({ gradients, selectedPresetId, onSelect }: PresetGradientsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {gradients.map((gradient) => {
          const isSelected = selectedPresetId === gradient.id;
          return (
            <GradientSwatch
              key={gradient.id}
              gradientCss={gradient.value}
              selected={isSelected}
              onClick={() => onSelect(gradient.id)}
              ariaLabel={`${gradient.name} preset`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface GradientSwatchProps {
  gradientCss: string;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

function GradientSwatch({ gradientCss, selected, onClick, ariaLabel }: GradientSwatchProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group relative flex h-12 w-full items-center overflow-hidden rounded-xl text-left transition focus-visible:ring-2 focus-visible:ring-offset-2",
        selected ? "ring-2 ring-white/70" : "ring-1 ring-white/15",
      )}
      style={{ background: gradientCss }}
    >
      <span className="sr-only">Gradient swatch</span>
    </button>
  );
}

interface GradientAngleControlProps {
  angle: number;
  onChange: (angle: number) => void;
}

function GradientAngleControl({ angle, onChange }: GradientAngleControlProps) {
  const normalized = ((Math.round(angle) % 360) + 360) % 360;

  const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  const handleNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(0, Math.min(360, parsed));
    onChange(clamped);
  };

  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <div className="flex items-center justify-between uppercase tracking-[0.3em]">
        <span>Angle</span>
        <span className="text-[13px] font-semibold text-foreground">{normalized}°</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={360}
          value={normalized}
          onChange={handleRangeChange}
          className="h-1 flex-1 appearance-none rounded-full bg-border/40 accent-primary"
        />
        <input
          type="number"
          min={0}
          max={360}
          value={normalized}
          onChange={handleNumberChange}
          className="w-14 rounded border border-border/30 bg-background px-2 py-0.5 text-right text-xs text-foreground"
        />
      </div>
    </div>
  );
}

function areGradientsEqual(a?: CustomGradient, b?: CustomGradient) {
  if (!a || !b) return false;
  return a.from === b.from && a.to === b.to;
}
