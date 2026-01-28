"use client";

import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface BackgroundSwatchProps {
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  style?: CSSProperties;
  children?: ReactNode;
  className?: string;
}

export function BackgroundSwatch({
  selected,
  onClick,
  ariaLabel,
  style,
  children,
  className,
}: BackgroundSwatchProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group relative flex h-12 w-full items-center overflow-hidden rounded-md p-0 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2",
        selected
          ? "shadow-sm ring-2 ring-foreground/50 ring-offset-1 ring-offset-background"
          : "ring-1 ring-white/15",
        className,
      )}
      style={style}
    >
      {children}
    </Button>
  );
}
