"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { PartyPopper } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { brandPersonalityValues, type BrandPersonality } from "@/lib/types/brand";

type BrandProfilePayload = {
  profile?: {
    logoPath?: string | null;
    personality?: string | null;
    colorPalette?: { accent?: string; mode?: string } | null;
  } | null;
  logoUrl?: string | null;
};

type OnboardingModalProps = {
  open: boolean;
  required?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompleted: () => void;
};

export function OnboardingModal({
  open,
  required = true,
  onOpenChange,
  onCompleted,
}: OnboardingModalProps) {
  const [profile, setProfile] = useState<BrandProfilePayload | null>(null);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isCancelled = false;
    setHasLoadedProfile(false);

    fetch("/api/brand/profile", { credentials: "include" })
      .then(async (res) => {
        const payload = (await res.json()) as BrandProfilePayload & { error?: string };
        if (!res.ok) throw new Error(payload?.error ?? "Failed to load brand profile");
        return payload;
      })
      .then((payload) => {
        if (isCancelled) return;
        setProfile(payload);
        setHasLoadedProfile(true);
      })
      .catch(() => {
        if (isCancelled) return;
        setProfile(null);
        setHasLoadedProfile(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [open]);

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

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (required && !next) return;
        onOpenChange?.(next);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => {
            if (required) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (required) e.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(1040px,calc(100vw-1.5rem))] translate-x-[-50%] translate-y-[-50%]",
            "overflow-hidden rounded-2xl border border-white/10 bg-[#07070a] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_120px_-60px_rgba(0,0,0,0.9)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 18% 22%, rgba(99,102,241,0.30), transparent 45%),
                  radial-gradient(circle at 82% 28%, rgba(236,72,153,0.20), transparent 48%),
                  radial-gradient(circle at 40% 86%, rgba(34,211,238,0.12), transparent 45%)
                `,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/65" />
          </div>

          <div className="relative">
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5">
                  <PartyPopper className="size-4 text-white/90" />
                </div>
                <div className="space-y-0.5">
                  <DialogPrimitive.Title className="text-sm font-semibold text-white">
                    Welcome to Brand
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-xs text-white/60">
                    Quick setup so your next export looks unmistakably you.
                  </DialogPrimitive.Description>
                </div>
              </div>
            </header>

            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
              {hasLoadedProfile ? (
                <OnboardingForm
                  initialLogoUrl={profile?.logoUrl ?? null}
                  initialLogoPath={profile?.profile?.logoPath ?? null}
                  initialAccent={initialAccent}
                  initialMode={initialMode}
                  initialPersonality={initialPersonality}
                  embedded
                  onCompleted={onCompleted}
                />
              ) : (
                <div className="px-5 py-10 text-center text-sm text-white/60 sm:px-6">
                  Loading your brand setup…
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
