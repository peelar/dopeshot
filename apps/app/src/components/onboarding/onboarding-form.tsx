"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { track } from "@/lib/analytics";
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

function getDerivedPalette(mode: BrandMode) {
  return mode === "dark"
    ? { background: "#0A0A0A", text: "#FAFAFA" }
    : { background: "#FFFFFF", text: "#0A0A0A" };
}

export function OnboardingForm({
  initialLogoUrl,
  initialLogoPath,
  initialAccent,
  initialMode,
  initialPersonality,
  embedded = false,
  onCompleted,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const modeOptions = useMemo(
    () => [
      { id: "light", label: "Light" },
      { id: "dark", label: "Dark" },
    ],
    [],
  );

  const handleLogoUpload = async (file: File) => {
    setErrorMessage(null);
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
      setErrorMessage(message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const canSubmit =
    Boolean(logoPath) &&
    /^#[0-9a-fA-F]{6}$/.test(accent) &&
    brandModeValues.includes(mode) &&
    brandPersonalityValues.includes(personality);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMessage("Please complete all fields to continue.");
      return;
    }

    setErrorMessage(null);
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
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const derived = getDerivedPalette(mode);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-4xl",
        embedded ? "px-5 py-6 sm:px-6 sm:py-8" : "px-4 py-10 sm:py-14",
      )}
    >
      <div className="flex flex-col items-start gap-6">
        <div className="flex items-start gap-4">
          <div
            className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_-30px_rgba(0,0,0,0.8)]"
            aria-hidden="true"
          >
            <Sparkles className="size-5 text-white/90" />
          </div>
          <div className="space-y-1">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Set up your brand in under 30 seconds
            </h1>
            <p className="max-w-[52ch] text-pretty text-sm text-white/65">
              We’ll use this on every export so your screenshots look like they belong to you.
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-white">Logo</h2>
                  <p className="text-xs text-white/60">
                    Upload a transparent PNG or SVG. We’ll auto-fit it.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo || isSubmitting}
                >
                  <Upload className="mr-2 size-4" />
                  {logoPath ? "Replace" : "Upload"}
                </Button>
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
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <div
                  className="relative grid aspect-[16/9] place-items-center bg-[length:22px_22px] p-4"
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
                        Drop in your logo
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        Recommended: 1024px wide, transparent background
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-white/70">Accent color</Label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={accent}
                        onChange={(e) => setAccent(normalizeHex(e.target.value))}
                        aria-label="Accent color picker"
                        disabled={isSubmitting}
                        className="h-10 w-10 cursor-pointer appearance-none rounded-lg border border-white/10 bg-transparent p-0"
                      />
                      <div
                        className="pointer-events-none absolute inset-0 rounded-lg"
                        style={{
                          boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 12px 30px -20px ${accent}80`,
                        }}
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
                  <Label className="text-xs text-white/70">Light / dark</Label>
                  <SegmentedControl
                    value={mode}
                    options={modeOptions}
                    onChange={(value) => setMode(value as BrandMode)}
                    ariaLabel="Select brand mode"
                    className="border-white/10 bg-black/25"
                    buttonClassName="text-xs"
                  />

                  <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                    <div
                      className="relative overflow-hidden rounded-lg border border-white/10 p-4"
                      style={{
                        background: derived.background,
                        color: derived.text,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-40"
                        aria-hidden="true"
                        style={{
                          backgroundImage: `radial-gradient(circle at 20% 20%, ${accent}35, transparent 45%),
                            radial-gradient(circle at 70% 40%, ${accent}22, transparent 50%),
                            radial-gradient(circle at 35% 85%, ${accent}18, transparent 45%)`,
                        }}
                      />
                      <div className="relative">
                        <p className="text-sm font-semibold">Preview</p>
                        <p className="mt-1 text-xs opacity-80">
                          Your exports will default to this mode.
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ background: `${accent}22`, color: derived.text }}
                        >
                          <span
                            className="inline-block size-2 rounded-full"
                            style={{ background: accent }}
                          />
                          Accent
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:p-6">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white">Personality</h2>
                <p className="text-xs text-white/60">
                  This tunes the default typography + tone.
                </p>
              </div>

              <div className="mt-4">
                <div role="radiogroup" aria-label="Select brand personality" className="space-y-2">
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
                          "border-white/10 bg-black/25 hover:bg-black/35",
                          isActive &&
                            "border-white/25 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_14px_40px_-26px_rgba(0,0,0,0.9)]",
                          isSubmitting && "cursor-not-allowed opacity-70",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">
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

              <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-semibold text-white/85">What this changes</p>
                <ul className="mt-2 space-y-1 text-xs text-white/60">
                  <li>• Heading font family + weight</li>
                  <li>• Default spacing + corner radius</li>
                  <li>• Gradient energy + contrast</li>
                </ul>
              </div>

              {errorMessage ? (
                <p className="mt-5 text-xs text-red-300">{errorMessage}</p>
              ) : null}

              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || isUploadingLogo || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Saving…" : "Finish setup"}
                </Button>
                <div className="text-right text-[11px] text-white/50">
                  <div>~30 seconds</div>
                  <div className={cn(!canSubmit && "text-white/35")}>
                    {canSubmit ? "Ready" : "Missing fields"}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {!embedded ? (
          <p className="text-xs text-white/45">
            You can change this later in the Brand tab.
          </p>
        ) : null}
      </div>
    </div>
  );
}
