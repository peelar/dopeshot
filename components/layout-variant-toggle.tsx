"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useAtomValue, useSetAtom } from "jotai";
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
import { currentTemplateAtom, screenshotAssetAtom } from "@/hooks/atoms/derived";
import { resolvePatternChoice } from "@/domain/layout/patterns";

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

interface LayoutVariantToggleProps {
  onVariantChange: (variant: string) => void;
}

export function LayoutVariantToggle({ onVariantChange }: LayoutVariantToggleProps) {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const template = useAtomValue(currentTemplateAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hasSeenFull, setHasSeenFull] = useState(false);

  if (!template || template.variants.length <= 1) {
    return null;
  }

  const variants = template.variants;
  const activeVariant = variants.includes(config.variant) ? config.variant : variants[0];
  const backgroundType = config.background?.type;
  const isImageBackground = backgroundType === "image";
  const resolvedPattern = resolvePatternChoice(config, screenshotAsset?.colorPalette);

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
      onVariantChange(nextVariant);
      requestAnimationFrame(() => buttonRefs.current[nextIndex]?.focus());
    },
    [displayVariants, onVariantChange],
  );

  const handleSelectChange = useCallback(
    (value: string) => {
      onVariantChange(value);
    },
    [onVariantChange],
  );

  const handlePatternSelect = useCallback(
    (patternId: "none" | "grain" | "glow" | "grid") => {
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
    [setConfig],
  );

  return (
    <div className="w-full space-y-1.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full space-y-1.5 sm:w-1/2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Layouts
          </p>
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-muted/40 px-2 py-2 ring-1 ring-border/60 sm:bg-transparent sm:p-0 sm:ring-0">
            <div
              className="hidden flex-wrap items-center gap-2 sm:flex"
              role="radiogroup"
              aria-label="Layouts"
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
                    aria-label={`Switch to ${getLabel(variant)} layout`}
                    className={cn(
                      "rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors",
                      "hover:border-border hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                      isActive && "border-primary/40 bg-primary/10 text-primary shadow-sm",
                    )}
                    onClick={() => onVariantChange(variant)}
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
                <SelectTrigger className="h-9 w-fit min-w-[160px] rounded-full border border-border bg-background/70 px-3 text-xs font-semibold">
                  <SelectValue placeholder="Layouts" />
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

        <div className="w-full space-y-1.5 sm:w-1/2 sm:text-right">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Style
          </p>
          <div className="flex flex-wrap items-center justify-start gap-2 rounded-full bg-muted/40 px-2 py-2 ring-1 ring-border/60 sm:justify-end sm:bg-transparent sm:p-0 sm:ring-0">
            {!isImageBackground && (
              <div
                className="flex flex-wrap items-center gap-2"
                role="radiogroup"
                aria-label="Pattern"
              >
                {(["none", "grain", "glow", "grid"] as const).map((id) => {
                  const isActive = resolvedPattern === id;
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
                      onClick={() => handlePatternSelect(id)}
                    >
                      {id === "none" ? "Off" : id.charAt(0).toUpperCase() + id.slice(1)}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
