"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useTheme } from "next-themes";
import { Link2, Moon, Sun } from "lucide-react";
import { configAtom, brandSettingsAtom } from "@/hooks/atoms";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";
import type { BrandMode } from "@/lib/types/brand";

const DEFAULT_ACCENT = "#6366F1";

function normalizeHex(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return "";
}

function BrandLinkedBadge({
  ariaLabel,
  tooltip,
}: {
  ariaLabel: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={ariaLabel}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-sky-400/40 hover:text-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30"
          />
        }
      >
        <Link2 className="size-2.5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function TestimonialStyleSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const brandSettings = useAtomValue(brandSettingsAtom);
  const { resolvedTheme } = useTheme();

  const testimonial = config.layoutSpecificSettings?.testimonial;
  const fallbackMode: BrandMode = resolvedTheme === "dark" ? "dark" : "light";

  const effectiveAccent = useMemo(() => {
    const testimonialAccent = normalizeHex(testimonial?.styleAccent);
    if (testimonialAccent) return testimonialAccent;

    const brandAccent = normalizeHex(brandSettings.accent);
    if (brandAccent) return brandAccent;

    return DEFAULT_ACCENT;
  }, [brandSettings.accent, testimonial?.styleAccent]);

  const effectiveMode: BrandMode =
    testimonial?.styleMode ?? brandSettings.mode ?? fallbackMode;
  const storedAccent = normalizeHex(testimonial?.styleAccent);
  const brandAccent = normalizeHex(brandSettings.accent);
  const isAccentInheritedFromBrand = !storedAccent && Boolean(brandAccent);
  const isModeInheritedFromBrand = !testimonial?.styleMode && Boolean(brandSettings.mode);

  const [accentInput, setAccentInput] = useState(effectiveAccent);

  useEffect(() => {
    setAccentInput(effectiveAccent);
  }, [effectiveAccent]);

  const updateStyle = useCallback(
    (style: { styleAccent?: string; styleMode?: BrandMode }) => {
      setConfig((prev) => ({
        ...prev,
        layoutSpecificSettings: {
          ...prev.layoutSpecificSettings,
          testimonial: {
            ...prev.layoutSpecificSettings?.testimonial,
            ...style,
          },
        },
      }));
    },
    [setConfig],
  );

  const commitAccent = useCallback(
    (value: string) => {
      const normalized = normalizeHex(value);
      if (!normalized) return false;
      if (storedAccent === normalized) return true;
      updateStyle({ styleAccent: normalized });
      track("testimonial_style_edited", { field: "styleAccent" });
      return true;
    },
    [storedAccent, updateStyle],
  );

  const handleModeChange = useCallback(
    (mode: BrandMode) => {
      updateStyle({ styleMode: mode });
      track("testimonial_style_edited", { field: "styleMode" });
    },
    [updateStyle],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="testimonial-style-accent" className="text-xs font-medium text-muted-foreground">
            Background color
          </Label>
          {isAccentInheritedFromBrand && (
            <BrandLinkedBadge
              ariaLabel="Background color uses brand settings"
              tooltip={`Using Brand accent (${brandAccent}).`}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={effectiveAccent}
            onChange={(event) => {
              const value = event.target.value;
              setAccentInput(value);
              commitAccent(value);
            }}
            aria-label="Testimonial background color picker"
            className="h-10 w-10 cursor-pointer appearance-none overflow-hidden rounded-full border border-border/60 bg-transparent p-0 shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none"
          />
          <Input
            id="testimonial-style-accent"
            value={accentInput}
            onChange={(event) => {
              const value = event.target.value.toUpperCase();
              setAccentInput(value);
              commitAccent(value);
            }}
            onBlur={() => {
              if (!commitAccent(accentInput)) {
                setAccentInput(effectiveAccent);
              }
            }}
            className="h-9 flex-1 border-border/60 bg-muted/10 font-mono text-xs uppercase tracking-[0.08em] shadow-inner focus-visible:ring-1 focus-visible:ring-foreground/30"
            placeholder="#6366F1"
            inputMode="text"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Preferred mode</Label>
          {isModeInheritedFromBrand && (
            <BrandLinkedBadge
              ariaLabel="Preferred mode uses brand settings"
              tooltip={`Using Brand mode (${brandSettings.mode === "dark" ? "Dark" : "Light"}).`}
            />
          )}
        </div>
        <div className="relative grid grid-cols-2 rounded-lg border border-border bg-muted/20 p-1">
          <div
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-foreground/10 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.45)] transition-transform duration-200",
              effectiveMode === "light" ? "translate-x-0" : "translate-x-full",
            )}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => handleModeChange("light")}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              effectiveMode === "light" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Sun className="size-4" />
            Light
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("dark")}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              effectiveMode === "dark" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Moon className="size-4" />
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
