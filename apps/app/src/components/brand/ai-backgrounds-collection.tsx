"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { Loader2, Plus, RefreshCw, Check } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/utils/toast";
import { track } from "@/lib/analytics";
import {
  addCatalogBackground,
  listCatalogBackgrounds,
} from "@/domain/backgrounds/background-service";
import { BACKGROUNDS_PER_PAGE, MAX_BRAND_BACKGROUNDS } from "@/domain/backgrounds/constants";
import type { BrandPersonality } from "@/lib/types/brand";
import type { CatalogBackground } from "@/domain/backgrounds/types";
import { personalBackgroundsAtom } from "@/hooks/atoms/backgrounds";

interface AiBackgroundsCollectionProps {
  personality: BrandPersonality | null;
}

export function AiBackgroundsCollection({ personality }: AiBackgroundsCollectionProps) {
  const [backgrounds, setBackgrounds] = useAtom(personalBackgroundsAtom);
  const [catalog, setCatalog] = useState<CatalogBackground[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const addedCatalogIds = useMemo(() => {
    return new Set(
      backgrounds
        .filter((item) => item.sourceType === "catalog" && item.sourceId)
        .map((item) => item.sourceId as string),
    );
  }, [backgrounds]);

  const canAddMore = backgrounds.length < MAX_BRAND_BACKGROUNDS;

  const loadCatalog = useCallback(
    async ({ offset = 0, shuffle = false }: { offset?: number; shuffle?: boolean } = {}) => {
      if (!personality) {
        setCatalog([]);
        return;
      }

      shuffle ? setIsShuffling(true) : setIsLoading(true);

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
          setCatalog(fallback.items);
        } else {
          setCatalog(response.items);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load AI backgrounds";
        toast.error(message);
      } finally {
        setIsLoading(false);
        setIsShuffling(false);
      }
    },
    [personality],
  );

  useEffect(() => {
    void loadCatalog({ offset: 0 });
  }, [loadCatalog]);

  const handleShuffle = useCallback(() => {
    if (!personality) return;
    const offset = Math.floor(Math.random() * 48);
    void loadCatalog({ offset, shuffle: true });
    track("ai_backgrounds_shuffled", { personality });
  }, [loadCatalog, personality]);

  const handleAdd = useCallback(
    async (item: CatalogBackground) => {
      if (!canAddMore) {
        toast.error(`You can upload up to ${MAX_BRAND_BACKGROUNDS} backgrounds.`);
        return;
      }
      if (addedCatalogIds.has(item.id)) return;

      setAddingId(item.id);
      try {
        const background = await addCatalogBackground(item.id);
        setBackgrounds((prev) => [background, ...prev]);
        toast.success("Added to your library");
        track("ai_background_added", { catalog_id: item.id, personality: item.personality });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add background";
        toast.error(message);
      } finally {
        setAddingId(null);
      }
    },
    [addedCatalogIds, canAddMore, setBackgrounds],
  );

  const showEmptyState = !personality;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-semibold">AI Backgrounds</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            disabled={!personality || isLoading || isShuffling}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            {isShuffling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Shuffle
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Personality-matched suggestions you can add to your library.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </>
        ) : showEmptyState ? (
          <div className="col-span-3 flex min-h-[56px] items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground">
            Pick a personality to access AI suggestions.
          </div>
        ) : catalog.length === 0 ? (
          <div className="col-span-3 flex min-h-[56px] items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground">
            No AI backgrounds yet. Check back soon.
          </div>
        ) : (
          catalog.map((item) => (
            <AiBackgroundThumbnail
              key={item.id}
              background={item}
              isAdding={addingId === item.id}
              isAdded={addedCatalogIds.has(item.id)}
              isDisabled={!canAddMore}
              onAdd={() => handleAdd(item)}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface AiBackgroundThumbnailProps {
  background: CatalogBackground;
  isAdding: boolean;
  isAdded: boolean;
  isDisabled: boolean;
  onAdd: () => void;
}

function AiBackgroundThumbnail({
  background,
  isAdding,
  isAdded,
  isDisabled,
  onAdd,
}: AiBackgroundThumbnailProps) {
  return (
    <div className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-muted/30 p-0 text-left transition focus-within:ring-2 focus-within:ring-offset-2 ring-1 ring-border/60 hover:ring-border">
      {background.previewUrl ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${background.previewUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
          No preview
        </div>
      )}

      <div className="pointer-events-none absolute left-1 top-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
        AI
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:pointer-events-auto group-hover:bg-black/45 group-hover:opacity-100">
        <button
          type="button"
          onClick={onAdd}
          disabled={isAdded || isAdding || isDisabled}
          className={cn(
            "flex h-7 min-w-[72px] items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-semibold text-white transition",
            isAdded
              ? "bg-white/20 text-white"
              : "bg-white/20 hover:bg-white/30",
            (isAdding || isDisabled) && "cursor-not-allowed opacity-70",
          )}
        >
          {isAdding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isAdded ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {isAdded ? "Added" : "Add"}
        </button>
      </div>

      {!isAdded && isDisabled && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100">
          Limit reached
        </div>
      )}
    </div>
  );
}
