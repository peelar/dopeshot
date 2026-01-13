import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SegmentedOption {
  id: string;
  label: string | React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
}

interface SegmentedControlProps {
  value: string;
  options: SegmentedOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  buttonClassName?: string;
}

export function SegmentedControl({
  value,
  options,
  onChange,
  className,
  ariaLabel,
  buttonClassName,
}: SegmentedControlProps) {
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
        const button = (
          <Button
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={option.id}
            aria-disabled={option.disabled}
            tabIndex={option.disabled ? -1 : undefined}
            onClick={() => {
              if (option.disabled) return;
              onChange(option.id);
            }}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              isActive
                ? "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background dark:hover:bg-foreground dark:hover:text-background"
                : "text-muted-foreground hover:text-foreground",
              option.disabled && "cursor-not-allowed opacity-40",
              buttonClassName,
            )}
          >
            {option.label}
          </Button>
        );

        // Always use the same DOM structure to prevent layout shift
        // Tooltip only shows when disabled with tooltip text
        const showTooltip = option.disabled && option.tooltip;

        return (
          <div key={option.id} className="flex-1">
            <Tooltip>
              <TooltipTrigger render={<span className="flex w-full">{button}</span>} />
              {showTooltip && <TooltipContent>{option.tooltip}</TooltipContent>}
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
