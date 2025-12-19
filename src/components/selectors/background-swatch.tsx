"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

interface BackgroundSwatchProps {
  imageUrl: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  ariaLabel?: string;
  showRemove?: boolean;
}

export function BackgroundSwatch({
  imageUrl,
  selected,
  onClick,
  onRemove,
  ariaLabel,
  showRemove = false,
}: BackgroundSwatchProps) {
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
          : "ring-1 ring-white/15 hover:ring-white/30"
      )}
    >
      <img
        src={imageUrl}
        alt={ariaLabel || "Background"}
        className="h-full w-full object-cover"
        loading="lazy"
      />

      {showRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 opacity-0 shadow-sm transition hover:bg-background group-hover:opacity-100"
          aria-label="Remove background"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <span className="sr-only">Background swatch</span>
    </button>
  );
}
