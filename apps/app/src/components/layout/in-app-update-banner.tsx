"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "dopeshot:lastDismissedUpdateId";

type InAppUpdate = {
  id: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
};

const CURRENT_UPDATE: InAppUpdate = {
  id: "2026-01-accounts-saving-designs",
  title: "User accounts & saving designs",
  description: "Sign in to save designs and pick up where you left off.",
  cta: { label: "Sign up", href: "/auth" },
};

export function InAppUpdateBanner({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);
  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const update = CURRENT_UPDATE;

  useEffect(() => {
    try {
      setLastDismissedId(localStorage.getItem(STORAGE_KEY));
    } catch {
      setLastDismissedId(null);
    } finally {
      setReady(true);
    }
  }, []);

  const shouldShow = ready && lastDismissedId !== update.id;
  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        "relative z-40 overflow-hidden transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none",
        isClosing ? "max-h-0 opacity-0" : "max-h-16 opacity-100"
      )}
    >
      <section
        aria-label="Product update"
        className={cn(
          "relative border-b border-primary/20 bg-primary/10 px-4 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-primary/10 sm:px-6",
          className
        )}
      >
        <div className="flex items-center gap-2 pl-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex shrink-0 -translate-y-px items-center rounded-full border border-primary/25 bg-primary/20 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.22em] text-primary shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              NEW
            </span>
            <p className="min-w-0 text-xs text-foreground/90">
              <span className="font-premium text-foreground">{update.title}</span>
              <span className="hidden text-muted-foreground sm:inline"> — {update.description}</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            {update.cta ? (
              <Link
                href={update.cta.href}
                className={cn(
                  buttonVariants({ variant: "default", size: "xs" }),
                  "cursor-default shadow-none"
                )}
              >
                <User className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {update.cta.label}
              </Link>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="cursor-default text-foreground/70 hover:bg-primary/10 hover:text-foreground"
              aria-label="Dismiss update banner"
              onClick={() => {
                try {
                  localStorage.setItem(STORAGE_KEY, update.id);
                } catch {
                  // Ignore localStorage failures (privacy modes, etc.)
                }

                setIsClosing(true);
                window.setTimeout(() => {
                  setLastDismissedId(update.id);
                }, 200);
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/50 via-primary/10 to-transparent opacity-70 transition-opacity duration-200 motion-reduce:transition-none",
            isClosing && "opacity-0"
          )}
        />
      </section>
    </div>
  );
}
