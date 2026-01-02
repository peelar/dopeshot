"use client";

import { cn } from "@/lib/utils";

export function MemoryItemSkeleton() {
  return (
    <div className="relative group/item">
      <div
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg border p-2",
          "bg-muted"
        )}
      >
        {/* Thumbnail skeleton */}
        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted-foreground/10 animate-pulse" />

        {/* Content skeleton */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          {/* Date skeleton */}
          <div className="h-4 w-32 rounded bg-muted-foreground/10 animate-pulse" />
          {/* Optional badge skeleton */}
          <div className="h-5 w-16 rounded-full bg-muted-foreground/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
