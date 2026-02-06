"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
import { BookmarkCheck, Palette, CreditCard, User, X, PanelLeft, Check } from "lucide-react";
import { useUserTier } from "@/hooks/use-user-tier";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MemoryPanel } from "@/components/memory/memory-panel";
import { Button } from "@/components/ui/button";
import {
  currentSaveCountAtom,
  saveLimitAtom,
  memoryItemsAtom,
  hasExportsAtom,
  hasUnseenExportsAtom,
  justSavedAtom,
} from "@/hooks/atoms/memory";
import { BrandPanel } from "@/components/brand/brand-panel";
import { InAppHint } from "@/components/hints/in-app-hint";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const isDevelopment = process.env.NODE_ENV === "development";

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isBrandUser, isLoading: isTierLoading } = useUserTier();
  const saveCount = useAtomValue(currentSaveCountAtom);
  const saveLimit = useAtomValue(saveLimitAtom);
  const savedItems = useAtomValue(memoryItemsAtom);
  const hasExports = useAtomValue(hasExportsAtom);
  const hasUnseenExports = useAtomValue(hasUnseenExportsAtom);
  const [justSaved, setJustSaved] = useAtom(justSavedAtom);

  const isLoggedIn = Boolean(user);
  const showBrandTab = isLoggedIn;
  const brandDisabled = isTierLoading && isLoggedIn;
  const showBrandPanelLoading = isAuthLoading || (isLoggedIn && isTierLoading);

  const saveLimitLabel = Number.isFinite(saveLimit) ? `${saveCount}/${saveLimit}` : `${saveCount}`;
  const savedHeaderLabel = Number.isFinite(saveLimit)
    ? `${savedItems.length} of ${saveLimit}`
    : `${savedItems.length} saved`;
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
            tooltip: isBrandUser ? "Brand" : "Learn about Brand",
          }
        : null,
      isDevelopment
        ? {
            id: "billing",
            label: "Billing",
            icon: CreditCard,
            href: "/billing",
            tooltip: "Billing",
          }
        : null,
      isDevelopment
        ? {
            id: "account",
            label: "Account",
            icon: User,
            tooltip: "Account",
          }
        : null,
    ],
    [brandDisabled, isBrandUser, savedTooltip, showBrandTab],
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
          <TooltipTrigger
            render={(props) => (
              <span {...props}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-foreground/70 transition-colors",
                    "hover:border-border hover:bg-muted/60 hover:text-foreground",
                  )}
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </Link>
              </span>
            )}
          />
          <TooltipContent side="right">{item.tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    const isActive = activeView === item.id;
    const isSaved = item.id === "saved";
    const isDisabled = "disabled" in item && item.disabled;

    const navButton = (
      <button
        type="button"
        onClick={() => handleSelect(item.id as LeftSidebarView)}
        className={cn(
          "group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-foreground/70 transition-colors",
          "hover:border-border hover:bg-muted/60 hover:text-foreground",
          isActive && "border-border bg-muted text-foreground",
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
    );

    if (item.id === "brand" && isBrandUser && !isDisabled) {
      return (
        <InAppHint
          key={item.id}
          hintText="Your brand settings live here"
          fallbackText="Brand"
          defaultOpen={false}
          side="right"
          persistKey="hint:brand-settings"
        >
          {navButton}
        </InAppHint>
      );
    }

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger render={(props) => <span {...props}>{navButton}</span>} />
        <TooltipContent side="right">{item.tooltip}</TooltipContent>
      </Tooltip>
    );
  };

  const renderPanelHeader = (title: string, meta?: string) => (
    <div className="flex h-14 items-center justify-between border-b bg-muted/40 px-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="flex items-center gap-3">
        {meta ? <span className="text-sm text-muted-foreground">{meta}</span> : null}
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-md p-1 hover:bg-accent"
          aria-label={`Close ${title.toLowerCase()} panel`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderBrandContent = () => {
    if (showBrandPanelLoading) {
      return <BrandPanelLoading />;
    }

    return isBrandUser ? <BrandPanel /> : <BrandTeaser />;
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
              showHeader={false}
            />
          ) : activeView === "brand" ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {renderBrandContent()}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col px-4 py-6">
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium text-foreground">
                  {user?.email ?? "Unknown user"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : null;
  }

  return (
    <TooltipProvider>
      <div className="relative hidden h-full sm:flex">
        <div className="h-full w-14 flex-col items-center gap-3 border-r border-border bg-background py-4 sm:flex">
          {navItems.map(renderNavButton)}
        </div>

        {isOpen ? (
          <aside
            role="complementary"
            className={cn(
              "absolute left-14 top-0 z-40 h-full w-[22rem] overflow-hidden border-r border-border bg-background/95 shadow-lg",
              "backdrop-blur supports-[backdrop-filter]:bg-background/80",
            )}
            aria-label="Account sidebar"
          >
            {activeView === "saved" ? (
              <div className="flex h-full min-h-0 flex-col">
                {renderPanelHeader("Saved", savedHeaderLabel)}
                <MemoryPanel
                  onLoadItem={onLoadItem}
                  onDeleteItem={onDeleteItem}
                  onClose={() => onOpenChange(false)}
                  isVisible={isOpen && activeView === "saved"}
                  showHeader={false}
                  className="flex-1"
                />
              </div>
            ) : activeView === "brand" ? (
              <div className="flex h-full w-full flex-col overflow-y-auto">
                {renderPanelHeader("Brand")}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {renderBrandContent()}
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col">
                {renderPanelHeader("Account")}
                <div className="px-4 py-6">
                  <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium text-foreground">
                      {user?.email ?? "Unknown user"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

function BrandPanelLoading() {
  return (
    <div className="flex h-full w-full flex-col px-4 py-6">
      <p className="text-sm text-muted-foreground">Loading brand tools...</p>
    </div>
  );
}

function BrandTeaser() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("hey@dopeshot.io");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = "mailto:hey@dopeshot.io?subject=Brand%20early%20access";
    }
  };

  return (
    <div className="flex h-full w-full flex-col px-4 py-6">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
        Beta
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold text-foreground">Brand features</p>
        <p className="text-sm text-muted-foreground">
          I&apos;m building brand kits so every post you make looks like you — your logo, your colors, your personality.
          Testimonials, custom backgrounds, and more are on the way.
          <br />
          <br />
          Want early access? Shoot me an email.
        </p>
      </div>
      <div className="mt-4">
        <Button
          size="sm"
          type="button"
          variant="default"
          onClick={handleCopy}
          className="gap-1.5 font-mono text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            "hey@dopeshot.io"
          )}
        </Button>
      </div>
    </div>
  );
}
