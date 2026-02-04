"use client";

import { useAtom } from "jotai";
import { memorySidebarOpenAtom } from "@/hooks/atoms/memory";
import { MemoryPanel } from "./memory-panel";
import { cn } from "@/lib/utils";

interface MemorySidebarProps {
  onLoadItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
}

export function MemorySidebar({ onLoadItem, onDeleteItem }: MemorySidebarProps) {
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop - show when open, transparent on desktop for click-outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:bg-transparent"
          onClick={handleClose}
        />
      )}

      {/* Sidebar - always mounted for animation */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 border-r bg-background transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <MemoryPanel
          onLoadItem={onLoadItem}
          onDeleteItem={onDeleteItem}
          onClose={handleClose}
          isVisible={isOpen}
        />
      </aside>
    </>
  );
}
