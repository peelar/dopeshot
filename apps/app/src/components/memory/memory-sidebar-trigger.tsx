"use client";

import { useAtom, useAtomValue } from "jotai";
import { History } from "lucide-react";
import {
  memorySidebarOpenAtom,
  hasExportsAtom,
} from "@/hooks/atoms/memory";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface MemorySidebarTriggerProps {
  className?: string;
}

export function MemorySidebarTrigger({ className }: MemorySidebarTriggerProps) {
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);
  const hasExports = useAtomValue(hasExportsAtom);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      track("memory_button_clicked");
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
        className,
      )}
      aria-label="Toggle history sidebar"
      aria-pressed={isOpen}
    >
      <History className="h-4 w-4 transition-transform group-hover:scale-110" />
      <span className="hidden text-sm font-medium sm:inline">History</span>
    </button>
  );
}
