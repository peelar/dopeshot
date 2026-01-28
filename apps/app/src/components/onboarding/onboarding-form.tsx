"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/utils/toast";
import {
  brandModeValues,
  brandPersonalityLabels,
  brandPersonalityValues,
  type BrandMode,
  type BrandPersonality,
} from "@/lib/types/brand";
import { cn } from "@/lib/utils/cn";

type OnboardingFormProps = {
  initialLogoUrl?: string | null;
  initialLogoPath?: string | null;
  initialAccent?: string | null;
  initialMode?: BrandMode | null;
  initialPersonality?: BrandPersonality | null;
  embedded?: boolean;
  onCompleted?: () => void;
  onDismiss?: () => void;
};

function normalizeHex(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "#000000";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash;
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return "#000000";
}

export function OnboardingForm({
  initialLogoUrl,
  initialLogoPath,
  initialAccent,
  initialMode,
  initialPersonality,
  embedded = false,
  onCompleted,
  onDismiss,
}: OnboardingFormProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [logoPath, setLogoPath] = useState<string | null>(initialLogoPath ?? null);
  const [accent, setAccent] = useState<string>(
    normalizeHex(initialAccent ?? "#6366F1"),
  );
  const [mode, setMode] = useState<BrandMode>(
    initialMode && brandModeValues.includes(initialMode) ? initialMode : "dark",
  );
  const [personality, setPersonality] = useState<BrandPersonality>(
    initialPersonality && brandPersonalityValues.includes(initialPersonality)
      ? initialPersonality
      : "founder",
  );

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropZonePattern = useMemo(() => {
    const isDark = resolvedTheme !== "light";
    const tint = isDark ? "255,255,255" : "0,0,0";
    const opacity = isDark ? 0.06 : 0.05;
    return `
      linear-gradient(45deg, rgba(${tint},${opacity}) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(${tint},${opacity}) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(${tint},${opacity}) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(${tint},${opacity}) 75%)
    `;
  }, [resolvedTheme]);

  const cardSurface =
    "rounded-2xl border border-border bg-card/95 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_24px_90px_-60px_rgba(0,0,0,0.35)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_26px_110px_-70px_rgba(0,0,0,0.75)]";

  const personalityOptions = useMemo(
    () =>
      brandPersonalityValues.map((id) => ({
        id,
        label: brandPersonalityLabels[id],
      })),
    [],
  );

  const personalityDescriptions: Record<BrandPersonality, string> = useMemo(
    () => ({
      hipster: "Bold, expressive, announcement-oriented.",
      founder: "Sharp, clean, precise. Modern tech vibes.",
      hacker: "Terminal vibes, functional, no fluff.",
      kawaii: "Warm, rounded, Studio Ghibli feel.",
    }),
    [],
  );

  const personalityFontClasses: Record<BrandPersonality, string> = useMemo(
    () => ({
      hipster: "font-bold",
      founder: "font-clean",
      hacker: "font-developer",
      kawaii: "font-ghibli",
    }),
    [],
  );

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const response = await fetch("/api/brand/upload-logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Logo upload failed");
      }

      setLogoUrl(payload?.signedUrl ?? null);
      setLogoPath(payload?.logoPath ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logo upload failed";
      toast.error(message);
      onDismiss?.();
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const canSubmit =
    /^#[0-9a-fA-F]{6}$/.test(accent) &&
    brandModeValues.includes(mode) &&
    brandPersonalityValues.includes(personality);

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Please check your selections and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/brand/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_path: logoPath,
          personality,
          accent,
          mode,
          onboarding_completed: true,
        }),
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save onboarding");
      }

      track("brand_onboarding_completed", {
        mode,
        personality,
        has_logo: Boolean(logoPath),
      });

      router.refresh();
      onCompleted?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save onboarding";
      toast.error(message);
      onDismiss?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-4xl",
        embedded ? "px-5 py-6 sm:px-6 sm:py-8" : "px-4 py-10 sm:py-14",
      )}
    >
      <div className="flex flex-col items-start gap-6">
        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
          <div className="flex h-full flex-col gap-4 lg:col-span-6">
            <section>
              <div className={cn(cardSurface, "p-5 sm:p-6")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">Start with your logo</h2>
                    <p className="text-xs text-muted-foreground">
                      Upload a transparent PNG or SVG.
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const next = e.target.files?.[0];
                    if (next) void handleLogoUpload(next);
                    e.currentTarget.value = "";
                  }}
                />

                <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/40 dark:bg-black/30">
                  <button
                    type="button"
                    aria-label="Upload logo"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (isUploadingLogo || isSubmitting) return;
                      const next = event.dataTransfer.files?.[0];
                      if (next) void handleLogoUpload(next);
                    }}
                    disabled={isUploadingLogo || isSubmitting}
                    className={cn(
                      "relative grid aspect-[16/9] w-full place-items-center bg-[length:22px_22px] p-4 transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      isUploadingLogo || isSubmitting
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer hover:bg-muted/70 dark:hover:bg-white/5",
                    )}
                    style={{
                      backgroundImage: dropZonePattern,
                      backgroundPosition: "0 0, 0 11px, 11px -11px, -11px 0px",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Your logo preview"
                        className={cn(
                          "max-h-full max-w-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
                          isUploadingLogo && "opacity-60",
                        )}
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Drop your logo here
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Recommended: 1024px wide, transparent background
                        </p>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className={cn(cardSurface, "p-5 sm:p-6")}>
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Choose your colors</h2>
                  <p className="text-xs text-muted-foreground">Pick an accent and a color scheme.</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">What accent color feels right?</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={accent}
                          onChange={(e) => setAccent(normalizeHex(e.target.value))}
                          aria-label="Accent color picker"
                          disabled={isSubmitting}
                          className="h-10 w-10 cursor-pointer appearance-none rounded-full border border-border bg-transparent p-0 shadow-[0_2px_10px_-6px_rgba(0,0,0,0.3)] [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Input
                          value={accent}
                          onChange={(e) => setAccent(normalizeHex(e.target.value))}
                          className="h-9 border-input bg-muted/60 font-mono text-xs text-foreground placeholder:text-muted-foreground"
                          placeholder="#6366F1"
                          inputMode="text"
                          disabled={isSubmitting}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Used for highlights, buttons, and gradients.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">What color scheme do you prefer?</Label>
                    <div className="relative grid grid-cols-2 rounded-xl border border-border bg-muted/50 p-1 dark:bg-black/25">
                      <div
                        className={cn(
                          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-background shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] transition-transform duration-200",
                          "dark:bg-white/10 dark:shadow-[0_8px_24px_-16px_rgba(255,255,255,0.25)]",
                          mode === "light" ? "translate-x-0" : "translate-x-full",
                        )}
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        onClick={() => setMode("light")}
                        disabled={isSubmitting}
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                          mode === "light" ? "text-foreground" : "text-muted-foreground",
                          isSubmitting && "cursor-not-allowed",
                        )}
                      >
                        <Sun className="size-4" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("dark")}
                        disabled={isSubmitting}
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                          mode === "dark" ? "text-foreground" : "text-muted-foreground",
                          isSubmitting && "cursor-not-allowed",
                        )}
                      >
                        <Moon className="size-4" />
                        Dark
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Used for composing color palettes.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-6 lg:h-full">
            <div className={cn(cardSurface, "flex h-full flex-col p-5 sm:p-6")}>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Select a personality that fits your product
                </h2>
                <p className="text-xs text-muted-foreground">
                  This sets the default typography + tone.
                </p>
              </div>

              <div className="mt-4 flex-1">
                <div role="radiogroup" aria-label="Which personality fits your brand" className="space-y-2">
                  {personalityOptions.map((option) => {
                    const isActive = personality === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setPersonality(option.id)}
                        disabled={isSubmitting}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition",
                          isActive
                            ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_18px_42px_-26px_rgba(0,0,0,0.45)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_40px_-26px_rgba(0,0,0,0.7)]"
                            : "border-border bg-muted/50 hover:bg-muted/70 dark:bg-black/25 dark:hover:bg-black/35",
                          isSubmitting && "cursor-not-allowed opacity-70",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div
                              className={cn(
                                "text-sm font-semibold text-foreground",
                                personalityFontClasses[option.id],
                              )}
                            >
                              {option.label}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {personalityDescriptions[option.id]}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "mt-1 inline-block size-2.5 rounded-full border border-border/80",
                              isActive ? "bg-primary" : "bg-transparent",
                            )}
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-col items-end gap-2">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || isUploadingLogo || isSubmitting}
                  className="sm:min-w-[180px]"
                >
                  {isSubmitting ? "Saving…" : "Finish setup"}
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Don’t worry, you can change these later.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
