"use client";

import { ReactNode } from "react";
import { cn } from "@/utils";

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background opacity-0 transition-opacity duration-150 group-hover:opacity-90 group-focus-within:opacity-90"
      >
        {label}
      </span>
    </span>
  );
}
