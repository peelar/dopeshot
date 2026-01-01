"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState, useRef } from "react";
import { X, History, Sparkles, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import {
  memorySidebarOpenAtom,
  memoryItemsAtom,
  memoryItemsLoadingAtom,
  loadedMemoryItemIdAtom,
  lastViewedHistoryAtom,
  hasUnseenExportsAtom,
} from "@/hooks/atoms/memory";
import { MemoryItem } from "./memory-item";
import { MemoryItemSkeleton } from "./memory-item-skeleton";
import type { MemoryItemDTO } from "@/domain/memory/types";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { setMemoryState } from "@/lib/storage/memory-state";
import { useAuth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

interface MemorySidebarProps {
  onLoadItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
}

export function MemorySidebar({ onLoadItem, onDeleteItem }: MemorySidebarProps) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useAtom(memorySidebarOpenAtom);
  const items = useAtomValue(memoryItemsAtom);
  const isLoadingItems = useAtomValue(memoryItemsLoadingAtom);
  const loadedItemId = useAtomValue(loadedMemoryItemIdAtom);
  const setLastViewed = useSetAtom(lastViewedHistoryAtom);
  const setHasUnseen = useSetAtom(hasUnseenExportsAtom);

  // Clear unseen badge when sidebar opens
  useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      setLastViewed(now);
      setHasUnseen(false);
      setMemoryState({ lastViewed: now });

      // Track sidebar opened
      track("saved_sidebar_opened", { authenticated: isAuthenticated });
    }
  }, [isOpen, isAuthenticated, setLastViewed, setHasUnseen]);

  const handleClose = () => {
    setIsOpen(false);
    track("saved_sidebar_closed");
  };

  const handleItemClick = (itemId: string) => {
    onLoadItem(itemId);
    // Close sidebar after loading item to show the preview
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
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b bg-muted/50 px-4">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-muted-foreground">Saved</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {items.length} of 5
            </span>
            <button
              onClick={handleClose}
              className="rounded-md p-1 hover:bg-accent"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto p-4">
          {isLoadingItems ? (
            <div className="space-y-3">
              <MemoryItemSkeleton />
              <MemoryItemSkeleton />
              <MemoryItemSkeleton />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              {isAuthenticated ? (
                // Empty state for logged-in users
                <div className="flex flex-col items-center text-muted-foreground">
                  <BookmarkCheck className="mb-3 h-10 w-10 opacity-40" />
                  <p className="text-sm font-medium">Nothing saved yet</p>
                  <p className="mt-1 text-xs opacity-75">
                    Create a design and click "Save" to access it later
                  </p>
                </div>
              ) : (
                // Empty state for logged-out users with subtle sign-up prompt
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold">Save Your Work</h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Create an account to save your exported designs
                  </p>
                  <Link
                    href="/auth"
                    onClick={() => {
                      track("saved_empty_state_signup_clicked");
                      handleClose();
                    }}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" })
                    )}
                  >
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <MemoryItem
                  key={item.id}
                  item={item}
                  isLoaded={item.id === loadedItemId}
                  onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
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
