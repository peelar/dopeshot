import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface AspectToggleOption {
  id: string;
  label: ReactNode;
  ariaLabel: string;
  iconOnly?: boolean;
}

interface AspectToggleProps {
  value: string;
  options: AspectToggleOption[];
  onChange: (nextValue: string) => void;
  className?: string;
}

export function AspectToggle({
  value,
  options,
  onChange,
  className,
}: AspectToggleProps) {
  return (
    <div className={cn("flex gap-1 rounded-md border border-border/40 bg-muted/20 p-0.5", className)}>
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <Button
            key={option.id}
            type="button"
            variant="ghost"
            size={option.iconOnly ? "icon-sm" : "sm"}
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            aria-label={option.ariaLabel}
            className={cn(
              "h-7 rounded transition-colors",
              option.iconOnly ? "w-7 p-0" : "min-w-11 px-2 text-[11px] font-semibold",
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
