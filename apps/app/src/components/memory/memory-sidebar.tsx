"use client";

import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { X, History } from "lucide-react";
import {
  memorySidebarOpenAtom,
  memoryItemsAtom,
  memoryLoadingAtom,
  loadedMemoryItemIdAtom,
} from "@/hooks/atoms/memory";
import { MemoryItem } from "./memory-item";
import type { MemoryItemDTO } from "@/domain/memory/types";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface MemorySidebarProps {
  onLoadItem: (itemId: string) => void;
}

export function MemorySidebar({ onLoadItem }: MemorySidebarProps) {
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);
  const [items, setItems] = useAtom(memoryItemsAtom);
  const [isLoading, setIsLoading] = useAtom(memoryLoadingAtom);
  const loadedItemId = useAtomValue(loadedMemoryItemIdAtom);

  // Fetch memory items when sidebar opens
  useEffect(() => {
    if (isOpen && items.length === 0 && !isLoading) {
      fetchMemoryItems();
    }

    // Track sidebar opened
    if (isOpen) {
      track("memory_sidebar_opened");
    }
  }, [isOpen]);

  const fetchMemoryItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/memory/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch memory items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    track("memory_sidebar_closed");
  };

  const handleItemClick = (itemId: string) => {
    onLoadItem(itemId);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={handleClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 border-r bg-background transition-transform",
          "lg:relative lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h2 className="font-semibold">Memory</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-57px)] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
              <History className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No exports yet</p>
              <p className="mt-1 text-xs">
                Your exported designs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <MemoryItem
                  key={item.id}
                  item={item}
                  isLoaded={item.id === loadedItemId}
                  onClick={() => handleItemClick(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
