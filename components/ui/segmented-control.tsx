import { cn } from "@/utils";

export interface SegmentedOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  value: string;
  options: SegmentedOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl({ value, options, onChange, className, ariaLabel }: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full gap-2 rounded-lg border border-border/40 bg-muted/20 p-1 text-xs font-medium",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={option.id}
            aria-disabled={option.disabled}
            onClick={() => {
              if (option.disabled) return;
              onChange(option.id);
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              option.disabled && "cursor-not-allowed opacity-40",
            )}
            disabled={option.disabled}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
