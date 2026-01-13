"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

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
      : "premium",
  );

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      technical: "Crisp, high-contrast, developer energy.",
      business: "Clear hierarchy, conservative polish.",
      creative: "Bolder shapes, louder gradients, playful spacing.",
      friendly: "Softer corners, warmer tone, approachable.",
      premium: "Editorial weight, tighter rhythm, luxury feel.",
    }),
    [],
  );

  const personalityFontClasses: Record<BrandPersonality, string> = useMemo(
    () => ({
      technical: "font-technical",
      business: "font-professional",
      creative: "font-edgy",
      friendly: "font-friendly",
      premium: "font-premium",
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-white">Start with your logo</h2>
                    <p className="text-xs text-white/60">
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

                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
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
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                      isUploadingLogo || isSubmitting
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer hover:bg-white/5",
                    )}
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%),
                        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)
                      `,
                      backgroundPosition: "0 0, 0 11px, 11px -11px, -11px 0px",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Your logo preview"
                        className={cn(
                          "max-h-full max-w-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]",
                          isUploadingLogo && "opacity-60",
                        )}
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-white/85">
                          Drop your logo here
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          Recommended: 1024px wide, transparent background
                        </p>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:p-6">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-white">Choose your colors</h2>
                  <p className="text-xs text-white/60">Pick an accent and a color scheme.</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">What accent color feels right?</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={accent}
                          onChange={(e) => setAccent(normalizeHex(e.target.value))}
                          aria-label="Accent color picker"
                          disabled={isSubmitting}
                          className="h-10 w-10 cursor-pointer appearance-none rounded-full border border-white/10 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Input
                          value={accent}
                          onChange={(e) => setAccent(normalizeHex(e.target.value))}
                          className="h-9 border-white/10 bg-black/20 font-mono text-xs text-white placeholder:text-white/40"
                          placeholder="#6366F1"
                          inputMode="text"
                          disabled={isSubmitting}
                        />
                        <p className="text-[11px] text-white/45">
                          Used for highlights, buttons, and gradients.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">What color scheme do you prefer?</Label>
                    <div className="relative grid grid-cols-2 rounded-xl border border-white/10 bg-black/25 p-1">
                      <div
                        className={cn(
                          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white/10 shadow-[0_8px_24px_-16px_rgba(255,255,255,0.45)] transition-transform duration-200",
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
                          mode === "light" ? "text-white" : "text-white/55",
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
                          mode === "dark" ? "text-white" : "text-white/55",
                          isSubmitting && "cursor-not-allowed",
                        )}
                      >
                        <Moon className="size-4" />
                        Dark
                      </button>
                    </div>
                    <p className="text-[11px] text-white/45">Used for composing color palettes.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-6 lg:h-full">
            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:p-6">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white">
                  Select a personality that fits your product
                </h2>
                <p className="text-xs text-white/60">
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
                            ? "border-white/25 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_14px_40px_-26px_rgba(0,0,0,0.9)]"
                            : "border-white/10 bg-black/25 hover:bg-black/35",
                          isSubmitting && "cursor-not-allowed opacity-70",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div
                              className={cn(
                                "text-sm font-semibold text-white",
                                personalityFontClasses[option.id],
                              )}
                            >
                              {option.label}
                            </div>
                            <div className="mt-1 text-xs text-white/60">
                              {personalityDescriptions[option.id]}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "mt-1 inline-block size-2.5 rounded-full border border-white/20",
                              isActive ? "bg-white" : "bg-transparent",
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
                <p className="text-[10px] text-white/45">
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
