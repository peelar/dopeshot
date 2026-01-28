"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BackgroundPageNavProps {
  activePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BackgroundPageNav({
  activePage,
  totalPages,
  onPageChange,
}: BackgroundPageNavProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center gap-1.5"
      aria-label="Background pages"
    >
      <button
        type="button"
        onClick={() => onPageChange(activePage - 1)}
        disabled={activePage === 0}
        className="p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-1" role="tablist">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            onClick={() => onPageChange(i)}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              i === activePage
                ? "bg-foreground"
                : "bg-muted-foreground/40 hover:bg-muted-foreground/60",
            )}
            aria-label={`Page ${i + 1}`}
            aria-selected={i === activePage}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(activePage + 1)}
        disabled={activePage === totalPages - 1}
        className="p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}
