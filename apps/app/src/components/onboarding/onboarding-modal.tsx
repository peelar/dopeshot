"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCallback, useMemo, useState } from "react";
import { PartyPopper, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { track } from "@/lib/analytics";
import { brandPersonalityValues, type BrandPersonality } from "@/lib/types/brand";
import { cn } from "@/lib/utils/cn";

export type BrandProfilePayload = {
  profile?: {
    logoPath?: string | null;
    personality?: string | null;
    colorPalette?: { accent?: string; mode?: string } | null;
  } | null;
  logoUrl?: string | null;
};

type OnboardingModalProps = {
  open: boolean;
  profile: BrandProfilePayload | null;
  required?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompleted: () => void;
};

export function OnboardingModal({
  open,
  profile,
  required = true,
  onOpenChange,
  onCompleted,
}: OnboardingModalProps) {
  const initialAccent = useMemo(() => {
    const accent = profile?.profile?.colorPalette?.accent;
    return typeof accent === "string" ? accent : null;
  }, [profile?.profile?.colorPalette?.accent]);

  const initialMode = useMemo(() => {
    const mode = profile?.profile?.colorPalette?.mode;
    return mode === "light" || mode === "dark" ? mode : null;
  }, [profile?.profile?.colorPalette?.mode]);

  const initialPersonality = useMemo(() => {
    const personality = profile?.profile?.personality;
    return brandPersonalityValues.includes(personality as BrandPersonality)
      ? (personality as BrandPersonality)
      : null;
  }, [profile?.profile?.personality]);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const persistDismissal = useCallback(async () => {
    try {
      await fetch("/api/brand/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboarding_dismissed: true }),
      });
    } catch {
      // Non-blocking: dismissal should not trap the user.
    }
  }, []);

  const handleConfirmedClose = useCallback(
    (reason: "user" | "error") => {
      track("brand_onboarding_dismissed", {
        reason,
      });

      if (reason === "user") {
        void persistDismissal();
      }

      onOpenChange?.(false);
      setConfirmOpen(false);
    },
    [onOpenChange, persistDismissal],
  );

  const handleUserClose = useCallback(() => {
    if (required) {
      setConfirmOpen(true);
      return;
    }

    handleConfirmedClose("user");
  }, [handleConfirmedClose, required]);

  const handleErrorClose = useCallback(() => {
    handleConfirmedClose("error");
  }, [handleConfirmedClose]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange?.(true);
          return;
        }

        handleUserClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(1040px,calc(100vw-1.5rem))] translate-x-[-50%] translate-y-[-50%]",
            "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground",
            "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_30px_120px_-60px_rgba(0,0,0,0.35)]",
            "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_120px_-60px_rgba(0,0,0,0.9)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute inset-0 opacity-60 dark:opacity-70"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 18% 22%, rgba(99,102,241,0.28), transparent 45%),
                  radial-gradient(circle at 82% 28%, rgba(236,72,153,0.18), transparent 48%),
                  radial-gradient(circle at 40% 86%, rgba(34,211,238,0.12), transparent 45%)
                `,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/75 to-background/90 dark:from-black/0 dark:via-black/20 dark:to-black/65" />
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Leave setup?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? Don't worry, you can fill it out later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleConfirmedClose("user")}>
                  Leave anyway
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="relative">
            <header className="flex items-center justify-between gap-4 border-b border-border/80 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl border border-border/80 bg-muted/40 dark:bg-white/5">
                  <PartyPopper className="size-4 text-primary" />
                </div>
                <DialogPrimitive.Title className="sr-only">
                  Brand onboarding
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Set up your brand identity
                </DialogPrimitive.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleUserClose}
                className="text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Close onboarding"
              >
                <X className="size-3.5" />
              </Button>
            </header>

            <div className="max-h-[calc(100vh-7rem)] min-h-[520px] overflow-y-auto">
              <OnboardingWizard
                initialLogoUrl={profile?.logoUrl ?? null}
                initialLogoPath={profile?.profile?.logoPath ?? null}
                initialAccent={initialAccent}
                initialMode={initialMode}
                initialPersonality={initialPersonality}
                onCompleted={onCompleted}
                onDismiss={handleErrorClose}
              />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
