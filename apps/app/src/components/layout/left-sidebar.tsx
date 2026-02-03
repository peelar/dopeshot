"use client";

import { useEffect, useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
import { BookmarkCheck, Palette, CreditCard, User, X, PanelLeft } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { SHOW_LOCKED_BRAND_TAB } from "@/lib/feature-flags-client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MemoryPanel } from "@/components/memory/memory-panel";
import {
  currentSaveCountAtom,
  saveLimitAtom,
  hasExportsAtom,
  hasUnseenExportsAtom,
  justSavedAtom,
} from "@/hooks/atoms/memory";
import { BrandPanel } from "@/components/brand/brand-panel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type LeftSidebarView = "saved" | "brand" | "account";

interface LeftSidebarProps {
  isOpen: boolean;
  activeView: LeftSidebarView;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: LeftSidebarView) => void;
  onLoadItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  isMobile: boolean;
}

export function LeftSidebar({
  isOpen,
  activeView,
  onOpenChange,
  onViewChange,
  onLoadItem,
  onDeleteItem,
  isMobile,
}: LeftSidebarProps) {
  const { user } = useAuth();
  const { isBrandUser, isLoading: isTierLoading } = useUserTier();
  const saveCount = useAtomValue(currentSaveCountAtom);
  const saveLimit = useAtomValue(saveLimitAtom);
  const hasExports = useAtomValue(hasExportsAtom);
  const hasUnseenExports = useAtomValue(hasUnseenExportsAtom);
  const [justSaved, setJustSaved] = useAtom(justSavedAtom);

  const showBrandTab = isBrandUser || SHOW_LOCKED_BRAND_TAB;
  const brandDisabled = isTierLoading || !isBrandUser;

  const saveLimitLabel = Number.isFinite(saveLimit) ? `${saveCount}/${saveLimit}` : `${saveCount}`;
  const savedTooltip = `Saved (${saveLimitLabel})`;
  const showSavedIndicator = justSaved || hasUnseenExports;

  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => {
      setJustSaved(false);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [justSaved, setJustSaved]);

  useEffect(() => {
    if (isOpen && activeView === "saved" && justSaved) {
      setJustSaved(false);
    }
  }, [activeView, isOpen, justSaved, setJustSaved]);

  const navItems = useMemo(
    () => [
      {
        id: "saved",
        label: "Saved",
        icon: BookmarkCheck,
        tooltip: savedTooltip,
      },
      showBrandTab
        ? {
            id: "brand",
            label: "Brand",
            icon: Palette,
            disabled: brandDisabled,
            tooltip: brandDisabled ? "Upgrade to Brand to unlock these tools." : "Brand",
          }
        : null,
      {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        href: "/settings/billing",
        tooltip: "Billing",
      },
      {
        id: "account",
        label: "Account",
        icon: User,
        tooltip: "Account",
      },
    ],
    [brandDisabled, savedTooltip, showBrandTab],
  );

  const handleSelect = (view: LeftSidebarView) => {
    if (view === "brand" && brandDisabled) return;
    const nextOpen = view === activeView ? !isOpen : true;
    onViewChange(view);
    onOpenChange(nextOpen);
  };

  const renderNavButton = (item: (typeof navItems)[number]) => {
    if (!item) return null;
    if ("href" in item && item.href) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-colors",
                "hover:border-border hover:bg-muted/60 hover:text-foreground",
              )}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    const isActive = activeView === item.id;
    const isSaved = item.id === "saved";
    const isDisabled = "disabled" in item && item.disabled;

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => handleSelect(item.id as LeftSidebarView)}
            className={cn(
              "group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent transition-colors",
              "hover:border-border hover:bg-muted/60 hover:text-foreground",
              isActive && "border-border bg-muted text-foreground",
              isSaved && !hasExports && !justSaved && "opacity-40",
              isDisabled && "cursor-not-allowed opacity-40",
            )}
            aria-label={item.label}
            aria-pressed={isActive}
            disabled={isDisabled}
          >
            <item.icon
              className={cn("h-5 w-5", isSaved && showSavedIndicator && "text-primary")}
              aria-hidden="true"
            />
            {isSaved && showSavedIndicator ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            ) : null}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{item.tooltip}</TooltipContent>
      </Tooltip>
    );
  };

  if (isMobile) {
    return isOpen ? (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
            {activeView === "saved" ? "Saved" : activeView === "brand" ? "Brand" : "Account"}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b px-3 py-2">
          <TooltipProvider>{navItems.map(renderNavButton)}</TooltipProvider>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeView === "saved" ? (
            <MemoryPanel
              onLoadItem={onLoadItem}
              onDeleteItem={onDeleteItem}
              onClose={() => onOpenChange(false)}
              isVisible={isOpen && activeView === "saved"}
            />
          ) : activeView === "brand" ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <BrandPanel />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col px-4 py-6">
              <h2 className="text-sm font-semibold text-foreground">Account</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Lightweight account controls are coming soon.
              </p>
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium text-foreground">{user?.email ?? "Unknown user"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : null;
  }

  return (
    <TooltipProvider>
      <div className="relative hidden h-full w-14 flex-col items-center gap-3 border-r border-border bg-background py-4 sm:flex">
        {navItems.map(renderNavButton)}
      </div>

      {isOpen ? (
        <aside
          role="complementary"
          className={cn(
            "fixed left-14 top-14 z-40 h-[calc(100vh-3.5rem)] w-[22rem] overflow-hidden border-r border-border bg-background/95 shadow-lg",
            "backdrop-blur supports-[backdrop-filter]:bg-background/80",
          )}
          aria-label="Account sidebar"
        >
          {activeView === "saved" ? (
            <MemoryPanel
              onLoadItem={onLoadItem}
              onDeleteItem={onDeleteItem}
              onClose={() => onOpenChange(false)}
              isVisible={isOpen && activeView === "saved"}
            />
          ) : activeView === "brand" ? (
            <div className="flex h-full w-full flex-col overflow-y-auto">
              <BrandPanel />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col px-4 py-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Account</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-md p-1 hover:bg-accent"
                  aria-label="Close account panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Lightweight account controls are coming soon.
              </p>
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium text-foreground">{user?.email ?? "Unknown user"}</p>
              </div>
            </div>
          )}
        </aside>
      ) : null}
    </TooltipProvider>
  );
}
