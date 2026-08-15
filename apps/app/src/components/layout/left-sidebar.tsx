"use client";

import { Palette, X, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandPanel } from "@/components/brand/brand-panel";
import { InAppHint } from "@/components/hints/in-app-hint";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeftSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

export function LeftSidebar({ isOpen, onOpenChange, isMobile }: LeftSidebarProps) {
  const brandButton = (
    <button
      type="button"
      onClick={() => onOpenChange(!isOpen)}
      className={cn(
        "group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-foreground/70 transition-colors",
        "hover:border-border hover:bg-muted/60 hover:text-foreground",
        isOpen && "border-border bg-muted text-foreground",
      )}
      aria-label="Brand"
      aria-pressed={isOpen}
    >
      <Palette className="h-5 w-5" aria-hidden="true" />
    </button>
  );

  const nav = (
    <InAppHint
      hintText="Your brand settings live here"
      fallbackText="Brand"
      defaultOpen={false}
      side="right"
      persistKey="hint:brand-settings"
    >
      {brandButton}
    </InAppHint>
  );

  const panel = (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <div className="flex h-14 items-center justify-between border-b bg-muted/40 px-4">
        <div className="text-sm font-semibold text-foreground">Brand</div>
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-md p-1 hover:bg-accent"
          aria-label="Close brand panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <BrandPanel />
      </div>
    </div>
  );

  if (isMobile) {
    return isOpen ? (
      <div className="fixed inset-0 z-50 flex">
        <button
          type="button"
          className="absolute inset-0 z-0 bg-black/40 backdrop-blur-sm"
          aria-label="Close sidebar overlay"
          onClick={() => onOpenChange(false)}
        />
        <div className="relative z-10 flex h-full w-[70%] max-w-[20rem] flex-col bg-background shadow-2xl">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
              Brand
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 hover:bg-accent"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <BrandPanel />
            </div>
          </div>
        </div>
      </div>
    ) : null;
  }

  return (
    <TooltipProvider>
      <div className="relative hidden h-full sm:flex">
        <div className="h-full w-14 flex-col items-center gap-3 border-r border-border bg-background py-4 sm:flex">
          {nav}
        </div>

        {isOpen ? (
          <aside
            role="complementary"
            className={cn(
              "absolute left-14 top-0 z-40 h-full w-[22rem] overflow-hidden border-r border-border bg-background/95 shadow-lg",
              "backdrop-blur supports-[backdrop-filter]:bg-background/80",
            )}
            aria-label="Brand sidebar"
          >
            {panel}
          </aside>
        ) : (
          <Tooltip>
            <TooltipTrigger render={(props) => <span {...props} className="sr-only">Brand</span>} />
            <TooltipContent side="right">Brand</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
