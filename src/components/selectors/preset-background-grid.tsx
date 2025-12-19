"use client";

import { BackgroundSwatch } from "./background-swatch";
import { Skeleton } from "@/components/ui/skeleton";
import type { PresetBackground } from "@/domain/backgrounds/types";

interface PresetBackgroundGridProps {
  backgrounds: PresetBackground[];
  selectedUrl?: string;
  onSelect: (background: PresetBackground) => void;
  isLoading?: boolean;
}

export function PresetBackgroundGrid({
  backgrounds,
  selectedUrl,
  onSelect,
  isLoading,
}: PresetBackgroundGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={`skeleton-${index}`} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!backgrounds.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
        No preset backgrounds available yet.
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
            ariaLabel={background.name}
          />
        );
      })}
    </div>
  );
}
