"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Label } from "@/components/ui/label";
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

  const currentAngle = useMemo(
    () => directionStringToDegrees(background.customGradient?.direction),
    [background.customGradient?.direction],
  );

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

  const handleColorChange = useCallback(
    (colorType: "from" | "to", value: string) => {
      const current = background.customGradient ?? {
        from: colorPalette?.accent ?? "#6366f1",
        to: "#ffffff",
        direction: degreesToDirection(currentAngle),
      };
      const newGradient = {
        ...current,
        direction: current.direction ?? degreesToDirection(currentAngle),
        [colorType]: value,
      };
      const textColor = getContrastTextColor(newGradient.from);
      onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient }, textColor);
    },
    [background.customGradient, colorPalette?.accent, currentAngle, onChangeAction],
  );

  const handleDirectionChange = useCallback(
    (angle: number) => {
      const current = background.customGradient ?? {
        from: colorPalette?.accent ?? "#6366f1",
        to: "#ffffff",
        direction: degreesToDirection(currentAngle),
      };
      const newGradient = {
        ...current,
        direction: degreesToDirection(angle),
      };
      const textColor = getContrastTextColor(newGradient.from);
      onChangeAction({ type: "gradient", value: "custom", customGradient: newGradient }, textColor);
    },
    [background.customGradient, colorPalette?.accent, currentAngle, onChangeAction],
  );

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

          {/* Angle dial */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <Label className="text-xs font-medium text-foreground">Angle</Label>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Drag to rotate
              </span>
            </div>
            <GradientAngleDial angle={currentAngle} onChange={handleDirectionChange} />
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

interface GradientAngleDialProps {
  angle: number;
  onChange: (angle: number) => void;
}

function GradientAngleDial({ angle, onChange }: GradientAngleDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const normalizedTarget = ((angle % 360) + 360) % 360;
  const roundedAngle = Math.round(normalizedTarget);
  const visualRotationRef = useRef(normalizedTarget);
  const [visualRotation, setVisualRotation] = useState(normalizedTarget);

  useLayoutEffect(() => {
    const prevNormalized = ((visualRotationRef.current % 360) + 360) % 360;
    let delta = normalizedTarget - prevNormalized;
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }
    const nextRotation = visualRotationRef.current + delta;
    visualRotationRef.current = nextRotation;
    setVisualRotation(nextRotation);
  }, [normalizedTarget]);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = dialRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = centerY - clientY;
      const radians = Math.atan2(dx, dy);
      const degrees = (radians * (180 / Math.PI) + 360) % 360;
      onChange(Math.round(degrees));
    },
    [onChange],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      pointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      updateFromPointer(event.clientX, event.clientY);
    },
    [updateFromPointer],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      updateFromPointer(event.clientX, event.clientY);
    },
    [updateFromPointer],
  );

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? 15 : 5;
      let nextAngle: number | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextAngle = (roundedAngle + step) % 360;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextAngle = (roundedAngle - step + 360) % 360;
      } else if (event.key === "Home") {
        nextAngle = 0;
      } else if (event.key === "End") {
        nextAngle = 180;
      } else if (event.key === "PageUp") {
        nextAngle = (roundedAngle + 45) % 360;
      } else if (event.key === "PageDown") {
        nextAngle = (roundedAngle - 45 + 360) % 360;
      }
      if (nextAngle === null) return;
      event.preventDefault();
      onChange(nextAngle);
    },
    [onChange, roundedAngle],
  );

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label="Gradient angle"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={roundedAngle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
        className="group relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-border/40 bg-gradient-to-br from-muted/30 via-transparent to-muted/20 shadow-inner transition hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="absolute inset-0 rounded-full border border-border/30" />
        <div
          className="absolute left-1/2 top-1/2 h-11 w-[1px] origin-bottom rounded-full bg-primary/70 shadow-[0_0_12px_rgba(59,130,246,0.45)] transition-all"
          style={{ transform: `translate(-50%, -100%) rotate(${visualRotation}deg)` }}
        />
        <div className="pointer-events-none flex flex-col items-center justify-center text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          <span>angle</span>
          <span className="text-xs text-foreground">{roundedAngle}°</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground/80">or use arrows</span>
    </div>
  );
}

