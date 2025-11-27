"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { getTemplateById } from "@/domain/layout/templates";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils";

const VARIANT_LABELS: Record<string, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
  full: "Full",
};

interface LayoutVariantToggleProps {
  config: LayoutConfig;
  onVariantChange: (variant: string) => void;
}

export function LayoutVariantToggle({ config, onVariantChange }: LayoutVariantToggleProps) {
  const template = useMemo(() => getTemplateById(config.templateId), [config.templateId]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hasSeenFull, setHasSeenFull] = useState(false);

  if (!template || template.variants.length <= 1) {
    return null;
  }

  const variants = template.variants;
  const activeVariant = variants.includes(config.variant) ? config.variant : variants[0];

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
      const nextIndex = (currentIndex + direction + variants.length) % variants.length;
      const nextVariant = variants[nextIndex];
      onVariantChange(nextVariant);
      requestAnimationFrame(() => buttonRefs.current[nextIndex]?.focus());
    },
    [onVariantChange, variants],
  );

  const handleSelectChange = useCallback(
    (value: string) => {
      onVariantChange(value);
    },
    [onVariantChange],
  );

  return (
    <div className="w-full space-y-1.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        Layouts
      </p>
      <div className="flex flex-wrap items-center gap-2 rounded-full bg-muted/40 px-2 py-2 ring-1 ring-border/60 sm:bg-transparent sm:p-0 sm:ring-0">
        <div className="hidden flex-wrap items-center gap-2 sm:flex" role="radiogroup" aria-label="Layouts">
          {variants.map((variant, index) => {
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
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
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
              {variants.map((variant) => (
                <SelectItem key={variant} value={variant} className="text-sm">
                  {getLabel(variant)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
