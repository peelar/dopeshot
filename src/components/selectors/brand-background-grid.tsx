"use client";

import { BackgroundSwatch } from "./background-swatch";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrandBackground } from "@/domain/backgrounds/types";

interface BrandBackgroundGridProps {
  backgrounds: BrandBackground[];
  selectedUrl?: string;
  onSelect: (background: BrandBackground) => void;
  onRemove?: (id: string) => void;
  isLoading?: boolean;
  showRemove?: boolean;
}

export function BrandBackgroundGrid({
  backgrounds,
  selectedUrl,
  onSelect,
  onRemove,
  isLoading,
  showRemove = false,
}: BrandBackgroundGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`skeleton-${index}`} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!backgrounds.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
        No brand backgrounds yet. Upload your first background to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {backgrounds.map((background) => {
        const isSelected = selectedUrl === background.url;
        return (
          <BackgroundSwatch
            key={background.id}
            imageUrl={background.thumbnailUrl || background.url}
            selected={isSelected}
            onClick={() => onSelect(background)}
            onRemove={showRemove && onRemove ? () => onRemove(background.id) : undefined}
            showRemove={showRemove}
            ariaLabel={background.name || "Brand background"}
          />
        );
      })}
    </div>
  );
}
