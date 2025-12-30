"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { X, History, Loader2 } from "lucide-react";
import {
  memorySidebarOpenAtom,
  memoryItemsAtom,
  memoryItemsLoadingAtom,
  loadedMemoryItemIdAtom,
  lastViewedHistoryAtom,
  hasUnseenExportsAtom,
} from "@/hooks/atoms/memory";
import { MemoryItem } from "./memory-item";
import type { MemoryItemDTO } from "@/domain/memory/types";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { setMemoryState } from "@/lib/storage/memory-state";
import { useAuth } from "@/lib/auth";

interface MemorySidebarProps {
  onLoadItem: (itemId: string) => void;
}

export function MemorySidebar({ onLoadItem }: MemorySidebarProps) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);
  const [items, setItems] = useAtom(memoryItemsAtom);
  const [isLoadingItems, setIsLoadingItems] = useAtom(memoryItemsLoadingAtom);
  const loadedItemId = useAtomValue(loadedMemoryItemIdAtom);
  const setLastViewed = useSetAtom(lastViewedHistoryAtom);
  const setHasUnseen = useSetAtom(hasUnseenExportsAtom);

  // Debug logging
  useEffect(() => {
    console.log("MemorySidebar isOpen state:", isOpen);
  }, [isOpen]);

  // Fetch memory items when sidebar opens + clear badge
  useEffect(() => {
    if (isOpen) {
      // Only fetch if authenticated
      if (isAuthenticated && items.length === 0 && !isLoadingItems) {
        fetchMemoryItems();
      } else if (!isAuthenticated) {
        // Clear items for unauthenticated users
        setItems([]);
        setIsLoadingItems(false);
      }

      // Clear unseen badge when sidebar opens
      const now = Date.now();
      setLastViewed(now);
      setHasUnseen(false);
      setMemoryState({ lastViewed: now });

      // Track sidebar opened
      track("memory_sidebar_opened", { authenticated: isAuthenticated });
    }
  }, [isOpen, items.length, isLoadingItems, isAuthenticated, setLastViewed, setHasUnseen, setItems, setIsLoadingItems]);

  const fetchMemoryItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch("/api/memory/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      } else if (response.status === 401) {
        // User is not authenticated, set empty items array
        // This prevents infinite retry loop
        setItems([]);
      } else {
        console.error("Failed to fetch memory items:", response.statusText);
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch memory items:", error);
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    track("memory_sidebar_closed");
  };

  const handleItemClick = (itemId: string) => {
    onLoadItem(itemId);
    // Close sidebar after loading item to show the preview
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop - only show when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
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
          {isLoadingItems ? (
            <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
              <Loader2 className="mb-2 h-8 w-8 animate-spin opacity-50" />
              <p className="text-sm">Loading your exports...</p>
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
