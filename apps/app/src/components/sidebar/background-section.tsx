"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { useUserTier } from "@/hooks/use-user-tier";
import { configAtom, screenshotGradientAtom, assetsAtom } from "@/hooks/atoms";
import {
  personalBackgroundsAtom,
  backgroundSelectionAtom,
} from "@/hooks/atoms/backgrounds";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import { BackgroundSwatch } from "@/components/selectors/background-swatch";
import { BackgroundPageNav } from "@/components/selectors/background-page-nav";
import { Skeleton } from "@/components/ui/skeleton";
import {
  clearBackgroundSelection,
  listPersonalBackgrounds,
  saveBackgroundSelection,
} from "@/domain/backgrounds/background-service";
import {
  BACKGROUNDS_PER_PAGE,
  MAX_BRAND_BACKGROUNDS,
} from "@/domain/backgrounds/constants";
import { track } from "@/lib/analytics";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import type { BackgroundSelection, PersonalBackground } from "@/domain/backgrounds/types";
import type { Asset } from "@/domain/asset/types";

interface BackgroundSectionProps {
  variant?: "default" | "inline";
}

export function BackgroundSection({ variant = "default" }: BackgroundSectionProps = {}) {
  const { data: session } = useSession();
  const { isBrandUser } = useUserTier();
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setAssets = useSetAtom(assetsAtom);
  const [backgrounds, setBackgrounds] = useAtom(personalBackgroundsAtom);
  const [selection, setSelection] = useAtom(backgroundSelectionAtom);

  const [activePage, setActivePage] = useState(0);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const [hasLoadedBackgrounds, setHasLoadedBackgrounds] = useState(false);

  const isAuthenticated = Boolean(session?.user);

  // Pagination math
  const hasScreenshot = Boolean(config.assets?.screenshot);

  const brandPageCount = isBrandUser && hasScreenshot
    ? Math.ceil(backgrounds.length / BACKGROUNDS_PER_PAGE)
    : 0;
  const totalPages = brandPageCount > 0 ? 1 + brandPageCount : 1;
  const showPagination = isBrandUser && hasScreenshot && totalPages > 1;

  // Reset selection and page on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelection(null);
      setActivePage(0);
    }
  }, [isAuthenticated, setSelection]);

  // Load brand backgrounds once when available
  useEffect(() => {
    if (hasLoadedBackgrounds || !isAuthenticated || !isBrandUser) return;

    async function loadBackgrounds() {
      setIsLoadingBackgrounds(true);
      try {
        const response = await listPersonalBackgrounds();
        setBackgrounds(response.items);
        setHasLoadedBackgrounds(true);
      } catch (error) {
        console.error("Failed to load personal backgrounds:", error);
      } finally {
        setIsLoadingBackgrounds(false);
      }
    }

    loadBackgrounds();
  }, [hasLoadedBackgrounds, backgrounds.length, isAuthenticated, isBrandUser, setBackgrounds]);

  // Clamp page when backgrounds are deleted externally (e.g. from Brand panel)
  useEffect(() => {
    const maxPage = totalPages - 1;
    if (activePage > maxPage) {
      setActivePage(Math.max(0, maxPage));
    }
  }, [activePage, totalPages]);

  // Force gradients tab for non-brand users to avoid showing brand pagination
  useEffect(() => {
    if ((!isBrandUser || !hasScreenshot) && activePage !== 0) {
      setActivePage(0);
    }
  }, [isBrandUser, hasScreenshot, activePage]);

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      setConfig((currentConfig) => {
        const currentBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        const grainEnabled = background.grainEnabled ?? currentBackground.grainEnabled ?? true;

        const newBackground = {
          ...currentBackground,
          ...background,
          grainEnabled,
          patternId: background.patternId ?? currentBackground.patternId,
          patternMode: background.patternMode ?? currentBackground.patternMode,
          patternVariant: background.patternVariant ?? currentBackground.patternVariant,
        };

        // Store screenshot gradient for persistence across layout changes
        setScreenshotGradient(newBackground);

        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: newBackground,
        };
      });

      // Clear personal background selection when gradient is chosen
      if (selection) {
        setSelection(null);
        void clearBackgroundSelection().catch(() => null);
      }

      // Jump back to gradients page
      setActivePage(0);
    },
    [selection, setConfig, setScreenshotGradient, setSelection],
  );

  const handleBrandBackgroundSelect = useCallback(
    async (background: PersonalBackground) => {
      if (!background.previewUrl) return;

      // Create an asset for the background image
      const backgroundAsset: Asset = {
        id: `personal-bg-${background.id}`,
        projectId: "personal",
        userId: session?.user?.id ?? "unknown",
        url: background.previewUrl,
        name: background.name || "Custom background",
        kind: "background",
        createdAt: new Date().toISOString(),
      };

      // Add asset to the assets list (replace old personal-bg assets)
      setAssets((prev) => {
        const filtered = prev.filter((a) => !a.id.startsWith("personal-bg-"));
        return [...filtered, backgroundAsset];
      });

      // Update config to use this background
      setConfig((currentConfig) => ({
        ...currentConfig,
        background: {
          type: "image",
          value: backgroundAsset.id,
        },
        assets: {
          ...currentConfig.assets,
          background: backgroundAsset.id,
        },
      }));

      // Save selection to backend
      const newSelection: BackgroundSelection = {
        backgroundType: "personal",
        backgroundId: background.id,
      };
      setSelection(newSelection);

      try {
        await saveBackgroundSelection(newSelection);
        track("personal_background_selected", {
          background_id: background.id,
        });
      } catch (error) {
        console.error("Failed to save background selection:", error);
      }
    },
    [session?.user?.id, setAssets, setConfig, setSelection],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setActivePage(page);
      track("background_page_changed", {
        page,
        total_pages: totalPages,
      });
    },
    [totalPages],
  );

  // Inline variant: just gradients, no pagination
  if (variant === "inline") {
    return <GradientPicker onChangeAction={handleGradientChange} variant="inline" />;
  }

  // Compute brand backgrounds for the active brand page
  const brandPageIndex = activePage - 1; // page 0 = gradients, page 1+ = brand
  const brandPageBackgrounds =
    brandPageIndex >= 0 && isBrandUser && hasScreenshot
      ? backgrounds.slice(
          brandPageIndex * BACKGROUNDS_PER_PAGE,
          (brandPageIndex + 1) * BACKGROUNDS_PER_PAGE,
        )
      : [];

  const headerLabel =
    activePage === 0
      ? "Background"
      : "Brand Backgrounds";

  return (
    <section className="space-y-3 px-4">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-semibold">{headerLabel}</span>
        {showPagination && (
          <BackgroundPageNav
            activePage={activePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {activePage === 0 ? (
        <GradientPicker onChangeAction={handleGradientChange} />
      ) : (
        <BrandBackgroundGrid
          backgrounds={brandPageBackgrounds}
          selection={selection}
          onSelect={handleBrandBackgroundSelect}
          isLoading={isLoadingBackgrounds}
        />
      )}
    </section>
  );
}

// --- Private sub-component ---

interface BrandBackgroundGridProps {
  backgrounds: PersonalBackground[];
  selection: BackgroundSelection | null;
  onSelect: (bg: PersonalBackground) => void;
  isLoading: boolean;
}

function BrandBackgroundGrid({
  backgrounds,
  selection,
  onSelect,
  isLoading,
}: BrandBackgroundGridProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30">
        <div className="px-3 pb-3 pt-3">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: BACKGROUNDS_PER_PAGE }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30">
      <div className="px-3 pb-3 pt-3">
        <div className="grid grid-cols-3 gap-3">
          {backgrounds.map((bg) => {
            const isSelected =
              selection?.backgroundType === "personal" &&
              selection?.backgroundId === bg.id;

            return (
              <BackgroundSwatch
                key={bg.id}
                onClick={() => onSelect(bg)}
                selected={isSelected}
                ariaLabel={bg.name || "Brand background"}
                className="justify-center"
              >
                {bg.previewUrl ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${bg.previewUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                    aria-hidden
                  />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/40 text-[10px] text-muted-foreground">
                      No preview
                    </div>
                  )}
              </BackgroundSwatch>
            );
          })}
        </div>
      </div>
    </div>
  );
}
