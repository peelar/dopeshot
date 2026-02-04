"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Loader2, Moon, RefreshCw, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useBackgroundUpload } from "@/hooks/use-background-upload";
import { invalidateTierCache } from "@/hooks/use-user-tier";
import { addCatalogBackground, listCatalogBackgrounds } from "@/domain/backgrounds/background-service";
import { BACKGROUNDS_PER_PAGE } from "@/domain/backgrounds/constants";
import type { CatalogBackground, PersonalBackground } from "@/domain/backgrounds/types";
import { SHOW_AI_BACKGROUNDS } from "@/lib/feature-flags-client";

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
  const bgInputRef = useRef<HTMLInputElement>(null);

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

  // Background upload
  const {
    upload: uploadBackground,
    reset: resetBackground,
    isUploading: isUploadingBackground,
    uploadedBackground,
  } = useBackgroundUpload({ showToasts: true, trackAnalytics: true });

  const [backgroundMode, setBackgroundMode] = useState<"upload" | "ai">(
    SHOW_AI_BACKGROUNDS ? "ai" : "upload",
  );
  const [catalogBackgrounds, setCatalogBackgrounds] = useState<CatalogBackground[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isCatalogShuffling, setIsCatalogShuffling] = useState(false);
  const [addingCatalogId, setAddingCatalogId] = useState<string | null>(null);
  const [selectedCatalogBackground, setSelectedCatalogBackground] =
    useState<PersonalBackground | null>(null);

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

  // Short descriptions for compact 2x2 layout
  const personalityDescriptions: Record<BrandPersonality, string> = useMemo(
    () => ({
      hipster: "Bold & expressive",
      founder: "Sharp & modern",
      hacker: "Terminal vibes",
      kawaii: "Warm & rounded",
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

  const backgroundModeOptions = useMemo(() => {
    const options = [{ id: "upload", label: "Upload" }];
    if (SHOW_AI_BACKGROUNDS) {
      options.push({ id: "ai", label: "AI suggestions" });
    }
    return options;
  }, []);

  const loadCatalogSuggestions = useCallback(
    async ({ offset = 0, shuffle = false }: { offset?: number; shuffle?: boolean } = {}) => {
      if (!SHOW_AI_BACKGROUNDS || backgroundMode !== "ai") return;
      setIsCatalogLoading(!shuffle);
      setIsCatalogShuffling(shuffle);

      try {
        const response = await listCatalogBackgrounds({
          personality,
          limit: BACKGROUNDS_PER_PAGE,
          offset,
        });
        if (response.items.length === 0 && offset > 0) {
          const fallback = await listCatalogBackgrounds({
            personality,
            limit: BACKGROUNDS_PER_PAGE,
            offset: 0,
          });
          setCatalogBackgrounds(fallback.items);
        } else {
          setCatalogBackgrounds(response.items);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load AI suggestions";
        toast.error(message);
      } finally {
        setIsCatalogLoading(false);
        setIsCatalogShuffling(false);
      }
    },
    [backgroundMode, personality],
  );

  const handleShuffleCatalog = useCallback(() => {
    const offset = Math.floor(Math.random() * 48);
    void loadCatalogSuggestions({ offset, shuffle: true });
  }, [loadCatalogSuggestions]);

  const handleSelectCatalog = useCallback(
    async (item: CatalogBackground) => {
      setAddingCatalogId(item.id);
      try {
        const background = await addCatalogBackground(item.id);
        setSelectedCatalogBackground(background);
        resetBackground();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add background";
        toast.error(message);
      } finally {
        setAddingCatalogId(null);
      }
    },
    [resetBackground],
  );

  useEffect(() => {
    if (!SHOW_AI_BACKGROUNDS || backgroundMode !== "ai") return;
    void loadCatalogSuggestions({ offset: 0 });
  }, [backgroundMode, loadCatalogSuggestions, personality]);

  useEffect(() => {
    if (backgroundMode === "upload") {
      setSelectedCatalogBackground(null);
    }
  }, [backgroundMode]);

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
        has_background: Boolean(uploadedBackground || selectedCatalogBackground),
      });

      // Invalidate tier cache in case user was upgraded during onboarding
      invalidateTierCache();

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

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundMode("upload");
      setSelectedCatalogBackground(null);
      void uploadBackground(file);
    }
    e.currentTarget.value = "";
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-4xl",
        embedded ? "px-5 py-6 sm:px-6 sm:py-8" : "px-4 py-10 sm:py-14",
      )}
    >
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Row 1: Logo (left) + Background (right) */}
        <section className="lg:col-span-6">
          <div className={cn(cardSurface, "h-full p-5 sm:p-6")}>
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
                  "relative grid aspect-video w-full place-items-center bg-size-[22px_22px] p-4 transition",
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

        <section className="lg:col-span-6">
          <div className={cn(cardSurface, "h-full p-5 sm:p-6")}>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                Add a reusable background
              </h2>
              <p className="text-xs text-muted-foreground">
                Use it across your designs.
              </p>
            </div>

            <input
              ref={bgInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleBgFileChange}
              className="hidden"
              aria-label="Upload background"
            />

            <div className="mt-4 space-y-3">
              {SHOW_AI_BACKGROUNDS ? (
                <SegmentedControl
                  value={backgroundMode}
                  options={backgroundModeOptions}
                  onChange={(value) => setBackgroundMode(value as "upload" | "ai")}
                  ariaLabel="Background source"
                />
              ) : null}

              {backgroundMode === "upload" ? (
                <>
                  {uploadedBackground ? (
                    <div className="relative overflow-hidden rounded-lg border border-border">
                      <div
                        className="aspect-video w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${uploadedBackground.previewUrl})` }}
                        aria-label="Uploaded background preview"
                      />
                      <button
                        type="button"
                        onClick={resetBackground}
                        disabled={isSubmitting}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                        aria-label="Remove background"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bgInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (isUploadingBackground || isSubmitting) return;
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          setBackgroundMode("upload");
                          setSelectedCatalogBackground(null);
                          void uploadBackground(file);
                        }
                      }}
                      disabled={isUploadingBackground || isSubmitting}
                      className={cn(
                        "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 transition",
                        "hover:border-border hover:bg-muted/50 dark:bg-black/20 dark:hover:bg-black/30",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        (isUploadingBackground || isSubmitting) && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {isUploadingBackground ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Drop or click to upload</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : selectedCatalogBackground ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <div
                    className="aspect-video w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${selectedCatalogBackground.previewUrl})` }}
                    aria-label="Selected AI background preview"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogBackground(null)}
                    disabled={isSubmitting}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    aria-label="Remove AI background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      AI suggestions for {brandPersonalityLabels[personality]}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleShuffleCatalog}
                      disabled={isCatalogLoading || isCatalogShuffling}
                      className="h-7 gap-1.5 px-2 text-xs"
                    >
                      {isCatalogShuffling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Shuffle
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {isCatalogLoading ? (
                      <>
                        <Skeleton className="aspect-video w-full rounded-lg" />
                        <Skeleton className="aspect-video w-full rounded-lg" />
                        <Skeleton className="aspect-video w-full rounded-lg" />
                      </>
                    ) : catalogBackgrounds.length === 0 ? (
                      <div className="col-span-3 flex min-h-[64px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground">
                        No AI backgrounds yet. Check back soon.
                      </div>
                    ) : (
                      catalogBackgrounds.map((item) => {
                        const selectedCatalogId =
                          (selectedCatalogBackground as PersonalBackground | null)?.sourceId ?? null;
                        const isSelected = selectedCatalogId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectCatalog(item)}
                            disabled={addingCatalogId === item.id || isSubmitting}
                            className={cn(
                              "group relative aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30 text-left transition",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                              (addingCatalogId === item.id || isSubmitting) && "cursor-not-allowed opacity-80",
                            )}
                          >
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundImage: `url(${item.previewUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                              aria-hidden
                            />
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white">
                                {addingCatalogId === item.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isSelected ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <ImagePlus className="h-3.5 w-3.5" />
                                )}
                                {isSelected ? "Selected" : "Select"}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Row 2: Colors (left) + Personality + Submit (right) */}
        <section className="lg:col-span-6">
          <div className={cn(cardSurface, "h-full p-5 sm:p-6")}>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">Choose your colors</h2>
              <p className="text-xs text-muted-foreground">Pick an accent and a color scheme.</p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Accent color</Label>
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
                  <div className="flex-1">
                    <Input
                      value={accent}
                      onChange={(e) => setAccent(normalizeHex(e.target.value))}
                      className="h-9 border-input bg-muted/60 font-mono text-xs text-foreground placeholder:text-muted-foreground"
                      placeholder="#6366F1"
                      inputMode="text"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Color scheme</Label>
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
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6">
          <div className={cn(cardSurface, "h-full p-5 sm:p-6")}>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                Pick a personality
              </h2>
              <p className="text-xs text-muted-foreground">
                Sets default typography + tone.
              </p>
            </div>

            <div className="mt-4">
              <div role="radiogroup" aria-label="Which personality fits your brand" className="grid grid-cols-2 gap-2">
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
                        "rounded-lg border px-3 py-2.5 text-left transition",
                        isActive
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-muted/50 hover:bg-muted/70 dark:bg-black/25 dark:hover:bg-black/35",
                        isSubmitting && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={cn(
                            "text-xs font-semibold text-foreground",
                            personalityFontClasses[option.id],
                          )}
                        >
                          {option.label}
                        </div>
                        <span
                          className={cn(
                            "inline-block size-2 shrink-0 rounded-full border border-border/80",
                            isActive ? "bg-primary" : "bg-transparent",
                          )}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {personalityDescriptions[option.id]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-col items-end gap-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isUploadingLogo || isUploadingBackground || isSubmitting}
          className="min-w-[200px]"
        >
          {isSubmitting ? "Saving…" : "Finish setup"}
        </Button>
        <p className="text-[10px] text-muted-foreground">
          You can change these later.
        </p>
      </div>
    </div>
  );
}
