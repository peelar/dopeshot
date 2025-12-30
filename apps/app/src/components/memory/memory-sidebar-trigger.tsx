"use client";

import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import {
  memorySidebarOpenAtom,
  hasExportsAtom,
  unseenExportCountAtom,
} from "@/hooks/atoms/memory";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface MemorySidebarTriggerProps {
  className?: string;
}

export function MemorySidebarTrigger({ className }: MemorySidebarTriggerProps) {
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);
  const hasExports = useAtomValue(hasExportsAtom);
  const unseenCount = useAtomValue(unseenExportCountAtom);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Trigger pulse animation when first export happens
  useEffect(() => {
    if (hasExports && unseenCount > 0 && !isOpen) {
      setShouldPulse(true);
      track("memory_button_highlighted");

      // Stop pulse after 2 iterations (1s * 2 = 2s)
      const timeout = setTimeout(() => setShouldPulse(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasExports, unseenCount, isOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      track(
        unseenCount > 0 ? "memory_button_clicked_with_badge" : "memory_button_clicked_no_badge",
        { unseenCount },
      );
      track("memory_sidebar_opened");
    } else {
      track("memory_sidebar_closed");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "group relative flex h-8 items-center gap-2 rounded-md px-3 transition-all",
        "hover:bg-accent/50 hover:text-accent-foreground",
        isOpen && "bg-accent text-accent-foreground",
        // Ghost state when no exports
        !hasExports && "opacity-40",
        // Pulse animation
        shouldPulse && "animate-pulse-highlight",
        className,
      )}
      aria-label="Toggle memory sidebar"
      aria-pressed={isOpen}
    >
      <History className="h-4 w-4 transition-transform group-hover:scale-110" />
      <span className="hidden text-sm font-medium sm:inline">History</span>

      {/* Badge indicator */}
      {unseenCount > 0 && (
        <span
          className={cn(
            "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5",
            "bg-primary text-[11px] font-semibold text-primary-foreground",
            "shadow-sm transition-transform group-hover:scale-110",
          )}
          aria-label={`${unseenCount} unseen exports`}
        >
          {unseenCount}
        </span>
      )}
    </button>
  );
}
