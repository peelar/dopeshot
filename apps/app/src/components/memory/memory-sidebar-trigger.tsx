"use client";

import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { BookmarkCheck } from "lucide-react";
import {
  memorySidebarOpenAtom,
  hasExportsAtom,
  justSavedAtom,
  currentSaveCountAtom,
  saveLimitAtom,
} from "@/hooks/atoms/memory";
import { cn } from "@/lib/utils";

interface MemorySidebarTriggerProps {
  className?: string;
}

export function MemorySidebarTrigger({ className }: MemorySidebarTriggerProps) {
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);
  const hasExports = useAtomValue(hasExportsAtom);
  const [justSaved, setJustSaved] = useAtom(justSavedAtom);
  const saveCount = useAtomValue(currentSaveCountAtom);
  const saveLimit = useAtomValue(saveLimitAtom);

  // Auto-clear indicator after 30 seconds
  useEffect(() => {
    if (justSaved) {
      const timeout = setTimeout(() => {
        setJustSaved(false);
      }, 30000); // 30 seconds

      return () => clearTimeout(timeout);
    }
  }, [justSaved, setJustSaved]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    // Clear indicator when opening sidebar
    if (newState && justSaved) {
      setJustSaved(false);
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
      aria-label="Toggle saved designs sidebar"
      aria-pressed={isOpen}
    >
      <BookmarkCheck className={cn("h-4 w-4", justSaved && "text-primary")} />
      <span className={cn("hidden text-sm font-medium sm:inline", justSaved ? "text-primary" : "text-foreground/60")}>
        Saved {hasExports && `(${saveCount}/${saveLimit})`}
      </span>
    </button>
  );
}
