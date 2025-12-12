"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils";
import { configAtom } from "@/hooks/atoms";
import { currentLookAtom, screenshotAssetAtom } from "@/hooks/atoms/derived";
import { resolvePatternChoice } from "@/domain/layout/patterns";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";

const VARIANT_LABELS: Record<string, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
  full: "Full",
};

const VARIANT_DISPLAY_PRIORITY: Record<string, number> = {
  left: 0,
  center: 1,
  right: 2,
};

const PATTERN_OPTIONS = ["none", "grain", "glow", "grid"] as const;
type PatternOption = (typeof PATTERN_OPTIONS)[number];

function usePatternControls(
  config: LayoutConfig,
  screenshotAsset: Asset | undefined,
  setConfig: (update: (current: LayoutConfig) => LayoutConfig) => void,
) {
  const backgroundType = config.background?.type;
  const isImageBackground = backgroundType === "image";
  const resolvedPattern = resolvePatternChoice(config, screenshotAsset?.colorPalette) as PatternOption;
  const shouldShowStyle = !isImageBackground;

  const handlePatternSelect = useCallback(
    (patternId: PatternOption) => {
      track("pattern_changed", {
        pattern: patternId,
        look_id: config.lookId,
      });

      setConfig((current) => {
        const background =
          current.background ?? ({
            type: "gradient",
            value: "custom",
          } as typeof current.background);
        return {
          ...current,
          background: {
            ...background,
            patternMode: "manual",
            patternId,
            grainEnabled: patternId === "grain",
          },
        };
      });
    },
    [setConfig, config.lookId],
  );

  const getPatternLabel = useCallback((id: PatternOption) => {
    return id === "none" ? "Off" : id.charAt(0).toUpperCase() + id.slice(1);
  }, []);

  return { resolvedPattern, shouldShowStyle, handlePatternSelect, getPatternLabel };
}

interface StyleControlsProps {
  activePattern: PatternOption;
  onSelectPattern: (pattern: PatternOption) => void;
  getPatternLabel: (id: PatternOption) => string;
}

function StyleControls({ activePattern, onSelectPattern, getPatternLabel }: StyleControlsProps) {
  return (
    <div className="ml-auto space-y-1.5 text-right sm:w-auto sm:min-w-0 sm:space-y-1">
      <p className="mr-[2px] text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        Style
      </p>
      <div className="flex flex-wrap items-center justify-start gap-2 sm:inline-flex sm:w-auto sm:justify-end sm:rounded-full sm:bg-muted/20 sm:px-2 sm:py-2 sm:ring-1 sm:ring-border/30">
        <div
          className="hidden flex-wrap items-center gap-2 sm:flex"
          role="radiogroup"
          aria-label="Pattern"
        >
          {PATTERN_OPTIONS.map((id) => {
            const isActive = activePattern === id;
            return (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                role="radio"
                aria-checked={isActive}
                aria-label={`Pattern ${id}`}
                className={cn(
                  "rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors",
                  "hover:border-border hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                  isActive && "border-primary/40 bg-primary/10 text-primary shadow-sm",
                )}
                onClick={() => onSelectPattern(id)}
              >
                {getPatternLabel(id)}
              </Button>
            );
          })}
        </div>

        <div className="w-full sm:hidden">
          <Select value={activePattern} onValueChange={(value) => onSelectPattern(value as PatternOption)}>
            <SelectTrigger className="h-9 w-fit min-w-[112px] flex-row-reverse justify-between rounded-full border border-border bg-background/70 px-3 text-right text-xs font-semibold">
              <SelectValue placeholder="Pattern" />
            </SelectTrigger>
            <SelectContent>
              {PATTERN_OPTIONS.map((id) => (
                <SelectItem key={id} value={id} className="text-sm capitalize">
                  {getPatternLabel(id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

interface VariantToggleProps {
  onVariantChange: (variant: string) => void;
}

export function VariantToggle({ onVariantChange }: VariantToggleProps) {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const look = useAtomValue(currentLookAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hasSeenFull, setHasSeenFull] = useState(false);

  if (!look) {
    return null;
  }

  const variants = look.variants;
  const hasMultipleVariants = variants.length > 1;
  const activeVariant = variants.includes(config.variant) ? config.variant : variants[0];

  const { resolvedPattern, shouldShowStyle, handlePatternSelect, getPatternLabel } =
    usePatternControls(config, screenshotAsset, setConfig);

  if (!hasMultipleVariants && !shouldShowStyle) {
    return null;
  }

  const displayVariants = useMemo(() => {
    return variants
      .map((variant, index) => ({ variant, index }))
      .sort((a, b) => {
        const priorityA = VARIANT_DISPLAY_PRIORITY[a.variant] ?? Number.MAX_SAFE_INTEGER;
        const priorityB = VARIANT_DISPLAY_PRIORITY[b.variant] ?? Number.MAX_SAFE_INTEGER;
        if (priorityA === priorityB) {
          return a.index - b.index;
        }
        return priorityA - priorityB;
      })
      .map((entry) => entry.variant);
  }, [variants]);

  useEffect(() => {
    if (activeVariant === "full") {
      setHasSeenFull(true);
    }
  }, [activeVariant]);

  const getLabel = useCallback((variant: string) => {
    return VARIANT_LABELS[variant] ?? variant.charAt(0).toUpperCase() + variant.slice(1);
  }, []);

  const handleArrowNavigation = useCallback(
    (event: KeyboardEvent, currentIndex: number) => {
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
        return;
      }
      event.preventDefault();

      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        (currentIndex + direction + displayVariants.length) % displayVariants.length;
      const nextVariant = displayVariants[nextIndex];
      track("variant_changed", {
        variant: nextVariant,
        look_id: config.lookId,
        interaction: "keyboard",
      });
      onVariantChange(nextVariant);
      requestAnimationFrame(() => buttonRefs.current[nextIndex]?.focus());
    },
    [displayVariants, onVariantChange, config.lookId],
  );

  const handleSelectChange = useCallback(
    (value: string) => {
      track("variant_changed", {
        variant: value,
        look_id: config.lookId,
      });
      onVariantChange(value);
    },
    [onVariantChange, config.lookId],
  );

  return (
    <div className="w-full space-y-1.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {hasMultipleVariants && (
          <div className="space-y-1.5 sm:w-auto sm:min-w-0 sm:space-y-1">
            <p className="ml-[2px] text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Variants
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:inline-flex sm:w-auto sm:rounded-full sm:bg-muted/20 sm:px-2 sm:py-2 sm:ring-1 sm:ring-border/30">
              <div
                className="hidden flex-wrap items-center gap-2 sm:flex"
                role="radiogroup"
                aria-label="Variants"
              >
                {displayVariants.map((variant, index) => {
                  const isActive = activeVariant === variant;
                  const showNewBadge = variant === "full" && !hasSeenFull;

                  return (
                    <Button
                      key={variant}
                      variant="ghost"
                      size="sm"
                      role="radio"
                      aria-checked={isActive}
                      aria-label={`Switch to ${getLabel(variant)} variant`}
                      className={cn(
                        "rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors",
                        "hover:border-border hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                        isActive && "border-primary/40 bg-primary/10 text-primary shadow-sm",
                      )}
                      onClick={() => {
                        track("variant_changed", {
                          variant,
                          look_id: config.lookId,
                        });
                        onVariantChange(variant);
                      }}
                      onKeyDown={(event) => handleArrowNavigation(event, index)}
                      ref={(el) => {
                        buttonRefs.current[index] = el;
                      }}
                    >
                      <span>{getLabel(variant)}</span>
                      {showNewBadge ? (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 font-bold text-[10px] text-primary-foreground">
                          New
                        </span>
                      ) : null}
                    </Button>
                  );
                })}
              </div>

              <div className="w-full sm:hidden">
                <Select value={activeVariant} onValueChange={handleSelectChange}>
                  <SelectTrigger className="h-9 w-fit min-w-[112px] rounded-full border border-border bg-background/70 px-3 text-xs font-semibold">
                    <SelectValue placeholder="Variants" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayVariants.map((variant) => (
                      <SelectItem key={variant} value={variant} className="text-sm">
                        {getLabel(variant)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {shouldShowStyle ? (
          <StyleControls
            activePattern={resolvedPattern}
            onSelectPattern={handlePatternSelect}
            getPatternLabel={getPatternLabel}
          />
        ) : null}
      </div>
    </div>
  );
}
