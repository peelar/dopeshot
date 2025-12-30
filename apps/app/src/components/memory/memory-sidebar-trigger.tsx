"use client";

import { useAtom } from "jotai";
import { History } from "lucide-react";
import { memorySidebarOpenAtom } from "@/hooks/atoms/memory";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function MemorySidebarTrigger() {
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      track("memory_sidebar_opened");
    } else {
      track("memory_sidebar_closed");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isOpen && "bg-accent text-accent-foreground",
      )}
      aria-label="Toggle memory sidebar"
      aria-pressed={isOpen}
    >
      <History className="h-4 w-4" />
      <span className="hidden sm:inline">Memory</span>
    </button>
  );
}
