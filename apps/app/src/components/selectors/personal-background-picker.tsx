"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { ChevronDown, ImageIcon, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUserTier } from "@/hooks/use-user-tier";
import { useSession } from "@/lib/auth/auth-client";
import {
  personalBackgroundsAtom,
  backgroundSelectionAtom,
} from "@/hooks/atoms/backgrounds";
import { configAtom, assetsAtom } from "@/hooks/atoms";
import {
  listPersonalBackgrounds,
  saveBackgroundSelection,
} from "@/domain/backgrounds/background-service";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import type { PersonalBackground } from "@/domain/backgrounds/types";
import type { Asset } from "@/domain/asset/types";

export function PersonalBackgroundPicker() {
  const { data: session } = useSession();
  const { isBrandUser, isLoading: isTierLoading } = useUserTier();
  const [backgrounds, setBackgrounds] = useAtom(personalBackgroundsAtom);
  const [selection, setSelection] = useAtom(backgroundSelectionAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const isAuthenticated = Boolean(session?.user);

  // Load backgrounds when opened for the first time
  useEffect(() => {
    if (!isOpen || hasLoaded || !isAuthenticated || !isBrandUser) return;

    async function loadBackgrounds() {
      setIsLoading(true);
      try {
        const response = await listPersonalBackgrounds();
        setBackgrounds(response.items);
        setHasLoaded(true);
      } catch (error) {
        console.error("Failed to load personal backgrounds:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBackgrounds();
  }, [isOpen, hasLoaded, isAuthenticated, isBrandUser, setBackgrounds]);

  const handleSelect = useCallback(
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

      // Add asset to the assets list
      setAssets((prev) => {
        // Remove any existing personal background asset
        const filtered = prev.filter(
          (a) => !a.id.startsWith("personal-bg-"),
        );
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
      const newSelection = {
        backgroundType: "personal" as const,
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

  // Don't show if not authenticated or not a brand user
  if (!isAuthenticated || isTierLoading || !isBrandUser) {
    return null;
  }

  // Don't show if no backgrounds and already loaded
  if (hasLoaded && backgrounds.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" />
            Your backgrounds
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-md" />
            ))}
          </div>
        ) : backgrounds.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No backgrounds yet. Add some in the Brand tab.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {backgrounds.map((background) => {
              const isSelected =
                selection?.backgroundType === "personal" &&
                selection?.backgroundId === background.id;

              return (
                <button
                  key={background.id}
                  type="button"
                  onClick={() => handleSelect(background)}
                  className={cn(
                    "group relative aspect-video overflow-hidden rounded-md border transition",
                    isSelected
                      ? "border-foreground/50 ring-2 ring-foreground/30"
                      : "border-border/60 hover:border-border",
                  )}
                >
                  {background.previewUrl ? (
                    <img
                      src={background.previewUrl}
                      alt={background.name || "Background"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                      No preview
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
