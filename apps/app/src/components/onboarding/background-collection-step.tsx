"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/utils/toast";
import { track } from "@/lib/analytics";
import {
  addCatalogBackground,
  listCatalogBackgrounds,
} from "@/domain/backgrounds/background-service";
import { MAX_BRAND_BACKGROUNDS } from "@/domain/backgrounds/constants";
import { brandPersonalityLabels, type BrandPersonality } from "@/lib/types/brand";
import type { CatalogBackground } from "@/domain/backgrounds/types";

const SECTION_LIMIT = 8;

export type BackgroundCollectionStepProps = {
  personality: BrandPersonality;
  isSubmitting?: boolean;
  onDone: (backgroundsAdded: number) => void;
  onSkip: (backgroundsAdded: number) => void;
};

export function BackgroundCollectionStep({
  personality,
  isSubmitting = false,
  onDone,
  onSkip,
}: BackgroundCollectionStepProps) {
  // Matched backgrounds
  const [matched, setMatched] = useState<CatalogBackground[]>([]);
  const [isMatchedLoading, setIsMatchedLoading] = useState(true);
  const [isMatchedShuffling, setIsMatchedShuffling] = useState(false);

  // Explore backgrounds (other personalities)
  const [explore, setExplore] = useState<CatalogBackground[]>([]);
  const [isExploreLoading, setIsExploreLoading] = useState(true);
  const [isExploreShuffling, setIsExploreShuffling] = useState(false);

  // Added state
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  const backgroundsAdded = addedIds.size;
  const canAddMore = backgroundsAdded < MAX_BRAND_BACKGROUNDS;

  // Load matched backgrounds
  const loadMatched = useCallback(
    async ({ offset = 0, shuffle = false }: { offset?: number; shuffle?: boolean } = {}) => {
      shuffle ? setIsMatchedShuffling(true) : setIsMatchedLoading(true);
      try {
        const response = await listCatalogBackgrounds({
          personality,
          limit: SECTION_LIMIT,
          offset,
        });
        if (response.items.length === 0 && offset > 0) {
          const fallback = await listCatalogBackgrounds({
            personality,
            limit: SECTION_LIMIT,
            offset: 0,
          });
          setMatched(fallback.items);
        } else {
          setMatched(response.items);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load backgrounds";
        toast.error(message);
      } finally {
        setIsMatchedLoading(false);
        setIsMatchedShuffling(false);
      }
    },
    [personality],
  );

  // Load explore backgrounds
  const loadExplore = useCallback(
    async ({ offset = 0, shuffle = false }: { offset?: number; shuffle?: boolean } = {}) => {
      shuffle ? setIsExploreShuffling(true) : setIsExploreLoading(true);
      try {
        const response = await listCatalogBackgrounds({
          excludePersonality: personality,
          limit: SECTION_LIMIT,
          offset,
        });
        if (response.items.length === 0 && offset > 0) {
          const fallback = await listCatalogBackgrounds({
            excludePersonality: personality,
            limit: SECTION_LIMIT,
            offset: 0,
          });
          setExplore(fallback.items);
        } else {
          setExplore(response.items);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load backgrounds";
        toast.error(message);
      } finally {
        setIsExploreLoading(false);
        setIsExploreShuffling(false);
      }
    },
    [personality],
  );

  // Fetch both sections on mount
  useEffect(() => {
    void loadMatched({ offset: 0 });
    void loadExplore({ offset: 0 });
  }, [loadMatched, loadExplore]);

  const handleShuffleMatched = useCallback(() => {
    const offset = Math.floor(Math.random() * 48);
    void loadMatched({ offset, shuffle: true });
    track("background_collection_shuffled", { personality, section: "matched" });
  }, [loadMatched, personality]);

  const handleShuffleExplore = useCallback(() => {
    const offset = Math.floor(Math.random() * 48);
    void loadExplore({ offset, shuffle: true });
    track("background_collection_shuffled", { personality, section: "explore" });
  }, [loadExplore, personality]);

  const handleAdd = useCallback(
    async (item: CatalogBackground) => {
      if (!canAddMore) {
        toast.error(`You can add up to ${MAX_BRAND_BACKGROUNDS} backgrounds.`);
        return;
      }
      if (addedIds.has(item.id)) return;

      setAddingId(item.id);
      try {
        await addCatalogBackground(item.id);
        setAddedIds((prev) => new Set(prev).add(item.id));
        track("background_added_during_onboarding", {
          catalog_id: item.id,
          personality: item.personality,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add background";
        toast.error(message);
      } finally {
        setAddingId(null);
      }
    },
    [addedIds, canAddMore],
  );

  return (
    <div className="relative mx-auto w-full max-w-4xl px-5 py-6 sm:px-6 sm:py-8">
      {backgroundsAdded > 0 && (
        <p className="mb-4 text-xs font-medium text-muted-foreground">
          {backgroundsAdded} / {MAX_BRAND_BACKGROUNDS} added
        </p>
      )}

      {/* Matched section */}
      <BackgroundSection
        title="Matches your personality"
        description={`Curated for your ${brandPersonalityLabels[personality]} style`}
        items={matched}
        isLoading={isMatchedLoading}
        isShuffling={isMatchedShuffling}
        addedIds={addedIds}
        addingId={addingId}
        canAddMore={canAddMore}
        isSubmitting={isSubmitting}
        onShuffle={handleShuffleMatched}
        onAdd={handleAdd}
      />

      {/* Explore section */}
      <div className="mt-8">
        <BackgroundSection
          title="More backgrounds"
          description="Outside your brand personality"
          items={explore}
          isLoading={isExploreLoading}
          isShuffling={isExploreShuffling}
          addedIds={addedIds}
          addingId={addingId}
          canAddMore={canAddMore}
          isSubmitting={isSubmitting}
          onShuffle={handleShuffleExplore}
          onAdd={handleAdd}
        />
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSkip(backgroundsAdded)}
          disabled={isSubmitting}
        >
          Skip
        </Button>
        <Button
          type="button"
          onClick={() => onDone(backgroundsAdded)}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? "Saving…" : "Done"}
        </Button>
      </div>
    </div>
  );
}

// -- Section sub-component --

interface BackgroundSectionProps {
  title: string;
  description: string;
  items: CatalogBackground[];
  isLoading: boolean;
  isShuffling: boolean;
  addedIds: Set<string>;
  addingId: string | null;
  canAddMore: boolean;
  isSubmitting: boolean;
  onShuffle: () => void;
  onAdd: (item: CatalogBackground) => void;
}

function BackgroundSection({
  title,
  description,
  items,
  isLoading,
  isShuffling,
  addedIds,
  addingId,
  canAddMore,
  isSubmitting,
  onShuffle,
  onAdd,
}: BackgroundSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onShuffle}
          disabled={isLoading || isShuffling || isSubmitting}
          className="h-7 shrink-0 gap-1.5 px-2 text-xs"
        >
          {isShuffling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Shuffle
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          <>
            {Array.from({ length: SECTION_LIMIT }, (_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-lg" />
            ))}
          </>
        ) : items.length === 0 ? (
          <div className="col-span-full flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground">
            No backgrounds available yet.
          </div>
        ) : (
          items.map((item) => {
            const isAdded = addedIds.has(item.id);
            const isAdding = addingId === item.id;
            const isDisabled = !canAddMore && !isAdded;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onAdd(item)}
                disabled={isAdded || isAdding || isDisabled || isSubmitting}
                className={cn(
                  "group relative aspect-video w-full overflow-hidden rounded-lg border transition",
                  isAdded
                    ? "border-primary/50 ring-2 ring-primary/20"
                    : "border-border/60 hover:border-border",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  (isAdding || isDisabled || isSubmitting) && "cursor-not-allowed opacity-80",
                )}
              >
                {item.previewUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.previewUrl})` }}
                    aria-hidden
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/30 text-[10px] text-muted-foreground">
                    No preview
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition",
                    isAdded
                      ? "bg-black/30"
                      : "bg-black/0 opacity-0 group-hover:bg-black/45 group-hover:opacity-100",
                  )}
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white">
                    {isAdding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isAdded ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {isAdded ? "Added" : "Add"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
