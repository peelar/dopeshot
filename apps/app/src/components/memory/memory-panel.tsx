"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAtomValue, useSetAtom } from "jotai";
import { BookmarkCheck, Sparkles, X } from "lucide-react";
import {
  memoryItemsAtom,
  memoryItemsLoadingAtom,
  loadedMemoryItemIdAtom,
  lastViewedHistoryAtom,
  hasUnseenExportsAtom,
  saveLimitAtom,
} from "@/hooks/atoms/memory";
import { useAuth } from "@/lib/auth";
import { setMemoryState } from "@/lib/storage/memory-state";
import { buttonVariants } from "@/components/ui/button";
import { MemoryItem } from "./memory-item";
import { MemoryItemSkeleton } from "./memory-item-skeleton";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface MemoryPanelProps {
  onLoadItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onClose?: () => void;
  isVisible?: boolean;
  className?: string;
  showHeader?: boolean;
}

export function MemoryPanel({
  onLoadItem,
  onDeleteItem,
  onClose,
  isVisible = true,
  className,
  showHeader = true,
}: MemoryPanelProps) {
  const { isAuthenticated } = useAuth();
  const items = useAtomValue(memoryItemsAtom);
  const isLoadingItems = useAtomValue(memoryItemsLoadingAtom);
  const loadedItemId = useAtomValue(loadedMemoryItemIdAtom);
  const setLastViewed = useSetAtom(lastViewedHistoryAtom);
  const setHasUnseen = useSetAtom(hasUnseenExportsAtom);
  const saveLimit = useAtomValue(saveLimitAtom);
  const saveLimitLabel = Number.isFinite(saveLimit) ? `${items.length} of ${saveLimit}` : `${items.length} saved`;

  useEffect(() => {
    if (!isVisible) return;
    const now = Date.now();
    setLastViewed(now);
    setHasUnseen(false);
    setMemoryState({ lastViewed: now });
  }, [isVisible, setHasUnseen, setLastViewed]);

  const handleItemClick = (itemId: string) => {
    onLoadItem(itemId);
    onClose?.();
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {showHeader ? (
        <div className="flex h-14 items-center justify-between border-b bg-muted/50 px-4">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-muted-foreground">Saved</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{saveLimitLabel}</span>
            {onClose ? (
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-accent"
                aria-label="Close saved panel"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingItems && items.length === 0 ? (
          <div className="space-y-3">
            <MemoryItemSkeleton />
            <MemoryItemSkeleton />
            <MemoryItemSkeleton />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            {isAuthenticated ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <BookmarkCheck className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm font-medium">Nothing saved yet</p>
                <p className="mt-1 text-xs opacity-75">
                  Create a design and click "Save" to access it later
                </p>
              </div>
            ) : (
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
                    onClose?.();
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
    </div>
  );
}
