"use client";

import { useState, useMemo, useCallback, useRef, useEffect, type ChangeEvent } from "react";
import { useAtomValue } from "jotai";
import { track } from "@/lib/analytics";
import { GRADIENTS, getGradientById } from "@/domain/layout/gradient-presets";
import {
  AdvancedGradient,
  BackgroundConfig,
  ColorToken,
  CustomGradient,
  isAdvancedGradient,
  isLegacyGradient,
} from "@/domain/layout/types";
import type { ColorPalette } from "@/domain/asset/types";
import {
  customGradientToCss,
  directionStringToDegrees,
  generateGradientOptions,
  getContrastTextColor,
} from "@/domain/layout/gradients";
import { cn } from "@/utils";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { configAtom, isAnalyzingColorsAtom } from "@/hooks/atoms";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <label
      htmlFor={id}
      className="flex flex-1 flex-col items-center gap-3 rounded-2xl bg-background/70 p-3 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground shadow-sm transition focus-within:bg-muted/30 hover:bg-muted/20 hover:shadow"
    >
      {label}
      <input
        type="color"
        id={id}
        value={localValue}
        onChange={handleChange}
        className="h-10 w-10 cursor-pointer appearance-none bg-transparent p-0 focus-visible:outline-none"
        aria-label={`${label} color`}
      />
    </label>
  );
}

type GradientSource = "screenshot" | "custom" | "preset";
type CustomColorStop = "start" | "mid" | "end";

interface GradientPickerProps {
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
}

export function GradientPicker({ onChangeAction }: GradientPickerProps) {
  const config = useAtomValue(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const background =
    config.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
  const colorPalette = screenshotAsset?.colorPalette;
  const hasScreenshot = Boolean(config.assets?.screenshot);
  const isCodeSnippet = config.layoutId === "code-snippet";

  // Generate multi-stop gradients from screenshot colors
  // Code snippets should never use screenshot-derived gradients
  const dynamicGradients = useMemo((): CustomGradient[] => {
    if (!colorPalette || isCodeSnippet) return [];

    // Use landscape as default aspect for picker (actual gradient uses correct aspect from page.tsx)
    return generateGradientOptions(colorPalette, {
      aspectCategory: "landscape",
      variant: undefined,
    });
  }, [colorPalette, isCodeSnippet]);

  const resolvedGradient = useMemo<CustomGradient | undefined>(() => {
    if (background.customGradient) return background.customGradient;
    if (background.type === "gradient" && background.value) {
      const preset = getGradientById(background.value);
      if (preset) return preset.gradient;
    }
    return undefined;
  }, [background.customGradient, background.type, background.value]);

  const currentGradientCss = useMemo((): string => {
    if (resolvedGradient) {
      return customGradientToCss(resolvedGradient);
    }
    return "linear-gradient(to right, #6366f1, #8b5cf6)";
  }, [resolvedGradient]);

  const hasScreenshotGradients = dynamicGradients.length > 0;

  const matchesScreenshotGradient = useMemo(() => {
    if (!background.customGradient || !hasScreenshotGradients) return false;
    return dynamicGradients.some((gradient) =>
      areGradientsEqual(gradient, background.customGradient),
    );
  }, [background.customGradient, dynamicGradients, hasScreenshotGradients]);

  const shouldPreferScreenshot = useMemo(
    () => isAnalyzingColors || matchesScreenshotGradient,
    [isAnalyzingColors, matchesScreenshotGradient],
  );

  const currentAngle = useMemo(() => {
    if (!resolvedGradient) return 90;
    if (isAdvancedGradient(resolvedGradient)) {
      return resolvedGradient.angle ?? 90;
    }
    if (isLegacyGradient(resolvedGradient)) {
      return directionStringToDegrees(resolvedGradient.direction);
    }
    return 90;
  }, [resolvedGradient]);

  const defaultSource = useMemo<GradientSource>(() => {
    const isPresetSelection =
      background.type === "gradient" &&
      background.value &&
      background.value !== "custom" &&
      !background.customGradient;

    if (isPresetSelection) {
      return "preset";
    }

    // Code snippets should never default to screenshot source
    if (!isCodeSnippet && shouldPreferScreenshot) {
      return "screenshot";
    }

    if (background.customGradient) {
      return "custom";
    }

    // Code snippets should never default to screenshot source
    if (!isCodeSnippet && (hasScreenshotGradients || hasScreenshot)) {
      return "screenshot";
    }

    return "custom";
  }, [
    background.customGradient,
    background.type,
    background.value,
    hasScreenshot,
    hasScreenshotGradients,
    shouldPreferScreenshot,
    isCodeSnippet,
  ]);

  const [activeSource, setActiveSource] = useState<GradientSource>(() =>
    hasScreenshot && !isCodeSnippet ? "screenshot" : defaultSource,
  );
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

  useEffect(() => {
    if (activeSource !== "screenshot") return;
    if (!hasScreenshot) return;
    if (!hasScreenshotGradients || dynamicGradients.length === 0) return;
    if (matchesScreenshotGradient) return;
    if (sourceOverrideRef.current) return;

    const firstGradient = dynamicGradients[0];
    if (!firstGradient) return;

    setActiveSource("screenshot");
    const textColor = getTextColorFromGradient(firstGradient);
    const grainEnabled = background.grainEnabled ?? true;
    onChangeAction(
      { type: "gradient", value: "custom", customGradient: firstGradient, gradientSource: "screenshot", grainEnabled },
      textColor,
    );
  }, [
    activeSource,
    background.grainEnabled,
    dynamicGradients,
    hasScreenshot,
    hasScreenshotGradients,
    matchesScreenshotGradient,
    onChangeAction,
  ]);

  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const currentTextColor = useMemo<ColorToken>(() => {
    if (resolvedGradient) {
      return getTextColorFromGradient(resolvedGradient);
    }
    if (background.type === "gradient" && background.value) {
      return getGradientById(background.value)?.textColor ?? "slate-900";
    }
    return "slate-900";
  }, [background.type, background.value, resolvedGradient]);

  const activePresetId =
    background.type === "gradient" && !background.customGradient ? background.value : undefined;

  const handlePresetSelect = useCallback(
    (gradientId: string) => {
      const gradient = getGradientById(gradientId);
      if (!gradient) return;
      track("gradient_preset_selected", {
        preset_id: gradientId,
        preset_name: gradient.name,
      });
      setActiveSourceWithOverride("preset");
      onChangeAction(
        { type: "gradient", value: gradientId, customGradient: undefined, gradientSource: "preset" },
        gradient.textColor ?? "slate-900",
      );
    },
    [onChangeAction, setActiveSourceWithOverride],
  );

  const handleCustomGradientSelect = useCallback(
    (gradient: CustomGradient) => {
      lockManualSource();
      const textColor = getTextColorFromGradient(gradient);
      onChangeAction({ type: "gradient", value: "custom", customGradient: gradient, gradientSource: "custom" }, textColor);
    },
    [lockManualSource, onChangeAction],
  );

  const handleColorChange = useCallback(
    (colorType: CustomColorStop, value: string) => {
      track("gradient_color_customized", {
        stop: colorType,
      });
      const colors = getCustomGradientColors(resolvedGradient, colorPalette);
      const nextColors = { ...colors, [colorType]: value };
      const newGradient = buildThreeStopGradient(nextColors, currentAngle, resolvedGradient);
      lockManualSource();
      const textColor = getTextColorFromGradient(newGradient);
      onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient, gradientSource: "custom" }, textColor);
    },
    [colorPalette, currentAngle, lockManualSource, onChangeAction, resolvedGradient],
  );

  const handleDirectionChange = useCallback(
    (angle: number) => {
      track("gradient_angle_changed", {
        angle,
      });
      const colors = getCustomGradientColors(resolvedGradient, colorPalette);
      const newGradient = buildThreeStopGradient(colors, angle, resolvedGradient);
      lockManualSource();
      const textColor = getTextColorFromGradient(newGradient);
      onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient, gradientSource: "custom" }, textColor);
    },
    [colorPalette, lockManualSource, onChangeAction, resolvedGradient],
  );

  const handleScreenshotSelect = useCallback(
    (gradient: CustomGradient) => {
      track("gradient_source_changed", {
        source: "screenshot",
      });
      setActiveSourceWithOverride("screenshot");
      const textColor = getTextColorFromGradient(gradient);
      onChangeAction({ type: "gradient", value: "custom", customGradient: gradient, gradientSource: "screenshot" }, textColor);
    },
    [onChangeAction, setActiveSourceWithOverride],
  );

  const screenshotTabDisabled = !hasScreenshotGradients && !isAnalyzingColors && !hasScreenshot;

  const gradientTabs = [
    ...(!isCodeSnippet ? [{
      id: "screenshot" as const,
      label: "From Screenshot",
      disabled: screenshotTabDisabled,
    }] : []),
    { id: "custom" as const, label: "Custom" },
    { id: "preset" as const, label: "Presets" },
  ] satisfies { id: GradientSource; label: string; disabled?: boolean }[];

  const handleTabChange = useCallback(
    (next: string) => {
      if (next === "screenshot" || next === "custom" || next === "preset") {
        track("gradient_source_changed", {
          from: activeSource,
          to: next,
        });
        setActiveSourceWithOverride(next);
      }
    },
    [activeSource, setActiveSourceWithOverride],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-muted/30">
        <div className="space-y-3 px-3 pb-3 pt-3">
          <SegmentedControl
            value={activeSource}
            options={gradientTabs}
            onChange={handleTabChange}
            ariaLabel="Select gradient source"
            className="text-[11px]"
            buttonClassName="px-2 py-1 text-[11px]"
          />

          {activeSource === "screenshot" && (
            <ScreenshotGradients
              gradients={dynamicGradients}
              activeGradient={background.customGradient}
              disabled={!hasScreenshotGradients}
              onSelect={handleScreenshotSelect}
              isLoading={isAnalyzingColors || (!hasScreenshotGradients && hasScreenshot)}
            />
          )}
          {activeSource === "custom" && (
            <CustomGradientControls
              activeGradient={resolvedGradient}
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
  isLoading?: boolean;
}

function ScreenshotGradients({
  gradients,
  activeGradient,
  disabled,
  onSelect,
  isLoading,
}: ScreenshotGradientsProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-2xl border border-dashed border-border/40 bg-background/50 px-3 text-left text-xs text-muted-foreground"
        aria-busy="true"
      >
        <p className="text-left text-[11px] text-muted-foreground/80">Sampling colors…</p>
      </div>
    );
  }

  if (!gradients.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
        Upload a screenshot to reveal curated gradients.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-3">
        {gradients.map((gradient, index) => {
          const isSelected = areGradientsEqual(activeGradient, gradient);
          return (
            <GradientSwatch
              key={`gradient-${index}`}
              gradientCss={customGradientToCss(gradient)}
              selected={isSelected}
              onClick={() => !disabled && onSelect(gradient)}
              ariaLabel="Screenshot gradient"
            />
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/80">Sampled from your screenshot</p>
    </div>
  );
}

interface CustomGradientControlsProps {
  activeGradient?: CustomGradient;
  colorPalette?: ColorPalette;
  angle: number;
  onColorChange: (colorType: CustomColorStop, value: string) => void;
  onAngleChange: (angle: number) => void;
}

function CustomGradientControls({
  activeGradient,
  colorPalette,
  angle,
  onColorChange,
  onAngleChange,
}: CustomGradientControlsProps) {
  const customColors = useMemo(
    () => getCustomGradientColors(activeGradient, colorPalette),
    [activeGradient, colorPalette],
  );
  const { start, mid, end } = customColors;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <DebouncedColorInput
          id="gradient-start-color"
          value={start}
          onChange={(value) => onColorChange("start", value)}
          label="Start"
        />
        <DebouncedColorInput
          id="gradient-mid-color"
          value={mid}
          onChange={(value) => onColorChange("mid", value)}
          label="Mid"
        />
        <DebouncedColorInput
          id="gradient-end-color"
          value={end}
          onChange={(value) => onColorChange("end", value)}
          label="End"
        />
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
              gradientCss={customGradientToCss(gradient.gradient)}
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
        selected
          ? "shadow-sm ring-2 ring-foreground/50 ring-offset-1 ring-offset-background"
          : "ring-1 ring-white/15",
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

  // Compare legacy gradients
  if (isLegacyGradient(a) && isLegacyGradient(b)) {
    // Compare colors only - ignore direction since users can adjust angle after selection
    return a.from === b.from && a.to === b.to;
  }

  // Compare advanced gradients
  if (isAdvancedGradient(a) && isAdvancedGradient(b)) {
    if (a.stops.length !== b.stops.length) return false;
    if (a.type !== b.type) return false;
    // Compare stops by colors and positions - ignore angle since it's user-adjustable
    return a.stops.every((stop, i) => {
      const otherStop = b.stops[i];
      if (!otherStop) return false;
      const colorMatch = stop.color === otherStop.color;
      const positionMatch =
        stop.position === otherStop.position ||
        Math.abs((stop.position ?? 0) - (otherStop.position ?? 0)) < 0.1;
      return colorMatch && positionMatch;
    });
  }

  // Different types are not equal
  return false;
}

type CustomGradientColors = {
  start: string;
  mid: string;
  end: string;
};

function getCustomGradientColors(
  gradient?: CustomGradient,
  palette?: ColorPalette,
): CustomGradientColors {
  const defaults = getDefaultCustomColors(palette);
  if (!gradient) {
    return defaults;
  }

  if (isAdvancedGradient(gradient)) {
    if (gradient.stops.length >= 3) {
      const midIndex = Math.floor(gradient.stops.length / 2);
      return {
        start: gradient.stops[0]?.color ?? defaults.start,
        mid: gradient.stops[midIndex]?.color ?? defaults.mid,
        end: gradient.stops[gradient.stops.length - 1]?.color ?? defaults.end,
      };
    }
    if (gradient.stops.length === 2) {
      return {
        start: gradient.stops[0]?.color ?? defaults.start,
        mid: gradient.stops[0]?.color ?? defaults.mid,
        end: gradient.stops[1]?.color ?? defaults.end,
      };
    }
    if (gradient.stops.length === 1) {
      const singleColor = gradient.stops[0]?.color ?? defaults.start;
      return { start: singleColor, mid: singleColor, end: singleColor };
    }
  }

  if (isLegacyGradient(gradient)) {
    const start = gradient.from ?? defaults.start;
    const end = gradient.to ?? defaults.end;
    const mid = mixHexColors(start, end) ?? defaults.mid;
    return { start, mid, end };
  }

  return defaults;
}

function getDefaultCustomColors(palette?: ColorPalette): CustomGradientColors {
  const start = palette?.accent ?? "#6366f1";
  const end = palette?.muted ?? palette?.dominant ?? "#ffffff";
  const mid = palette?.dominant ?? palette?.vibrant ?? mixHexColors(start, end) ?? start;
  return { start, mid, end };
}

function buildThreeStopGradient(
  colors: CustomGradientColors,
  angle: number,
  existing?: CustomGradient,
): AdvancedGradient {
  const normalizedAngle = ((Math.round(angle) % 360) + 360) % 360;
  const base = existing && isAdvancedGradient(existing) ? existing : undefined;
  return {
    type: base?.type ?? "linear",
    angle: base?.type === "linear" ? normalizedAngle : base?.angle ?? normalizedAngle,
    direction: base?.type !== "linear" ? base?.direction : undefined,
    colorSpace: base?.colorSpace ?? "oklch",
    stops: [
      { color: colors.start, position: 0 },
      { color: colors.mid, position: 50 },
      { color: colors.end, position: 100 },
    ],
  } satisfies AdvancedGradient;
}

function mixHexColors(a: string, b: string): string | undefined {
  const colorA = parseHexColor(a);
  const colorB = parseHexColor(b);
  if (!colorA || !colorB) return undefined;
  const mixed: [number, number, number] = [
    Math.round((colorA[0] + colorB[0]) / 2),
    Math.round((colorA[1] + colorB[1]) / 2),
    Math.round((colorA[2] + colorB[2]) / 2),
  ];
  return rgbToHex(mixed[0], mixed[1], mixed[2]);
}

function getTextColorFromGradient(gradient: CustomGradient): ColorToken {
  const palette: string[] = [];
  if (isAdvancedGradient(gradient)) {
    gradient.stops.forEach((stop) => {
      if (stop?.color) {
        palette.push(stop.color);
      }
    });
  } else if (isLegacyGradient(gradient)) {
    palette.push(gradient.from, gradient.to);
  }
  if (palette.length === 0) {
    palette.push("#000000");
  }
  return getContrastTextColor(palette);
}

function parseHexColor(hex: string): [number, number, number] | undefined {
  const normalized = hex.trim();
  const match = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/.exec(normalized);
  if (!match) return undefined;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
