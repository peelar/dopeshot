"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, Check, X, RefreshCw, Upload } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/utils/toast";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { brandPersonalityLabels, brandPersonalityValues } from "@/lib/types/brand";

type StatusFilter = "all" | "pending" | "approved" | "published" | "rejected";
type SourceFilter = "catalog" | "seeded";

type AdminCatalogItem = {
  id: string;
  personality: string;
  status: string;
  previewUrl: string | null;
  createdAt: string;
};

type SeededCatalogItem = {
  id: string;
  personality: string;
  prompt: string;
  seed: number | null;
  provider: string;
  model: string;
  imageUrl: string;
  widthPx: number;
  heightPx: number;
  createdAt: string;
};

const statusOptions: StatusFilter[] = [
  "pending",
  "approved",
  "published",
  "rejected",
  "all",
];

const sourceOptions: SourceFilter[] = ["seeded", "catalog"];
const PREVIEW_SCREENSHOT_SRC = "/demo1.png";

export function AiBackgroundPlayground() {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("seeded");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [personalityFilter, setPersonalityFilter] = useState<string>("all");
  const [items, setItems] = useState<AdminCatalogItem[]>([]);
  const [seedItems, setSeedItems] = useState<SeededCatalogItem[]>([]);
  const [previewItem, setPreviewItem] = useState<SeededCatalogItem | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isCatalogRefreshing, setIsCatalogRefreshing] = useState(false);
  const [isSeedLoading, setIsSeedLoading] = useState(true);
  const [isSeedRefreshing, setIsSeedRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [discardingId, setDiscardingId] = useState<string | null>(null);
  const [discardingAll, setDiscardingAll] = useState(false);

  const fetchCatalog = useCallback(
    async ({ refresh = false }: { refresh?: boolean } = {}) => {
      refresh ? setIsCatalogRefreshing(true) : setIsCatalogLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (personalityFilter) params.set("personality", personalityFilter);
        params.set("limit", "60");

        const response = await fetch(`/api/backgrounds/catalog/admin?${params.toString()}`);
        const payload = await safeJson(response);
        if (!response.ok) {
          throw new Error(payload?.error ?? `Failed to load catalog (HTTP ${response.status})`);
        }
        setItems(payload.items ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load catalog";
        toast.error(message);
      } finally {
        setIsCatalogLoading(false);
        setIsCatalogRefreshing(false);
      }
    },
    [personalityFilter, statusFilter],
  );

  const fetchSeeds = useCallback(
    async ({ refresh = false }: { refresh?: boolean } = {}) => {
      refresh ? setIsSeedRefreshing(true) : setIsSeedLoading(true);
      try {
        const params = new URLSearchParams();
        if (personalityFilter) params.set("personality", personalityFilter);

        const response = await fetch(`/api/backgrounds/catalog/seeds?${params.toString()}`);
        const payload = await safeJson(response);
        if (!response.ok) {
          throw new Error(payload?.error ?? `Failed to load seeds (HTTP ${response.status})`);
        }
        setSeedItems(payload.items ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load seeds";
        toast.error(message);
      } finally {
        setIsSeedLoading(false);
        setIsSeedRefreshing(false);
      }
    },
    [personalityFilter],
  );

  useEffect(() => {
    if (sourceFilter === "catalog") {
      void fetchCatalog();
    } else {
      void fetchSeeds();
    }
  }, [fetchCatalog, fetchSeeds, sourceFilter]);

  const handleStatusUpdate = useCallback(
    async (id: string, status: Exclude<StatusFilter, "all">) => {
      setUpdatingId(id);
      try {
        const response = await fetch("/api/backgrounds/catalog/admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        const payload = await safeJson(response);
        if (!response.ok) {
          throw new Error(payload?.error ?? `Failed to update background (HTTP ${response.status})`);
        }

        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item)),
        );
        toast.success("Status updated");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Update failed";
        toast.error(message);
      } finally {
        setUpdatingId(null);
      }
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/backgrounds/catalog/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await safeJson(response);
      if (!response.ok && response.status !== 204) {
        throw new Error(payload?.error ?? `Delete failed (HTTP ${response.status})`);
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Background deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleSeedAccept = useCallback(async (id: string) => {
    setAcceptingId(id);
    try {
      const response = await fetch("/api/backgrounds/catalog/seeds/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await safeJson(response);
      if (!response.ok) {
        throw new Error(payload?.error ?? `Accept failed (HTTP ${response.status})`);
      }
      setSeedItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Seed uploaded to catalog");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Accept failed";
      toast.error(message);
    } finally {
      setAcceptingId(null);
    }
  }, []);

  const handleSeedDiscard = useCallback(async (id: string) => {
    setDiscardingId(id);
    try {
      const response = await fetch("/api/backgrounds/catalog/seeds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await safeJson(response);
      if (!response.ok) {
        throw new Error(payload?.error ?? `Discard failed (HTTP ${response.status})`);
      }
      setSeedItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Seed discarded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Discard failed";
      toast.error(message);
    } finally {
      setDiscardingId(null);
    }
  }, []);

  const handleSeedDiscardAll = useCallback(async () => {
    if (seedItems.length === 0 || discardingAll) return;
    const confirmed = window.confirm("Discard all seeded backgrounds?");
    if (!confirmed) return;
    setDiscardingAll(true);
    try {
      const response = await fetch("/api/backgrounds/catalog/seeds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const payload = await safeJson(response);
      if (!response.ok) {
        throw new Error(payload?.error ?? `Discard all failed (HTTP ${response.status})`);
      }
      setSeedItems([]);
      toast.success("All seeded backgrounds discarded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Discard all failed";
      toast.error(message);
    } finally {
      setDiscardingAll(false);
    }
  }, [discardingAll, seedItems.length]);

  const filteredCount = useMemo(
    () => (sourceFilter === "catalog" ? items.length : seedItems.length),
    [items.length, seedItems.length, sourceFilter],
  );

  const isRefreshing = sourceFilter === "catalog" ? isCatalogRefreshing : isSeedRefreshing;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-6 py-10 text-foreground dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">AI Background Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Review AI-generated backgrounds and promote the best ones to the published catalog.
          </p>
        </header>

        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm">
          <FilterSelect
            label="Source"
            value={sourceFilter}
            onChange={(value) => setSourceFilter(value as SourceFilter)}
            options={sourceOptions}
          />
          {sourceFilter === "catalog" ? (
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          ) : null}
          <FilterSelect
            label="Personality"
            value={personalityFilter}
            onChange={setPersonalityFilter}
            options={["all", ...brandPersonalityValues]}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              sourceFilter === "catalog"
                ? fetchCatalog({ refresh: true })
                : fetchSeeds({ refresh: true })
            }
            className="ml-auto h-8 gap-2"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          {sourceFilter === "seeded" && seedItems.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={discardingAll}
              onClick={handleSeedDiscardAll}
            >
              {discardingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Discard all
            </Button>
          ) : null}
          <div className="text-xs text-muted-foreground">{filteredCount} items</div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sourceFilter === "catalog" ? (
            isCatalogLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`catalog-skeleton-${index}`}
                  className="h-40 w-full animate-pulse rounded-xl border border-border/60 bg-muted/30"
                />
              ))
            ) : items.length === 0 ? (
              <div className="col-span-full flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                No items match this filter.
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/70 shadow-sm"
                >
                <div
                  className="h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.previewUrl ?? ""})` }}
                />
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-background/80 px-3 py-2 text-xs">
                    <span className="font-semibold">
                      {brandPersonalityLabels[
                        item.personality as keyof typeof brandPersonalityLabels
                      ] ?? item.personality}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        item.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "approved"
                          ? "bg-blue-100 text-blue-700"
                          : item.status === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={updatingId === item.id}
                      onClick={() => handleStatusUpdate(item.id, "published")}
                    >
                      {updatingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Publish
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updatingId === item.id}
                      onClick={() => handleStatusUpdate(item.id, "rejected")}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-rose-200 hover:text-rose-100"
                      disabled={updatingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))
            )
          ) : isSeedLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`seed-skeleton-${index}`}
                className="h-40 w-full animate-pulse rounded-xl border border-border/60 bg-muted/30"
              />
            ))
          ) : seedItems.length === 0 ? (
            <div className="col-span-full flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
              No seeded backgrounds yet.
            </div>
          ) : (
            seedItems.map((item) => (
              <article
                key={item.id}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-background/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                role="button"
                tabIndex={0}
                onClick={() => setPreviewItem(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreviewItem(item);
                  }
                }}
              >
                <div
                  className="h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                  title={item.prompt}
                />
                <div className="border-t border-border/60 bg-background/80 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {brandPersonalityLabels[
                        item.personality as keyof typeof brandPersonalityLabels
                      ] ?? item.personality}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                      seeded
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[10px] text-muted-foreground">
                    {item.model}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Background Preview</DialogTitle>
            <DialogDescription>
              Preview the background with the sample screenshot overlay.
            </DialogDescription>
          </DialogHeader>
          {previewItem ? (
            <div className="grid gap-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
                <div
                  className="absolute inset-0 scale-105 bg-cover bg-center blur-sm"
                  style={{ backgroundImage: `url(${previewItem.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-black/10" />
                <GrainOverlay enabled intensity={0.25} />
                <img
                  src={PREVIEW_SCREENSHOT_SRC}
                  alt="Sample screenshot overlay"
                  className="absolute left-1/2 top-1/2 z-10 w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl shadow-black/30"
                />
              </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {brandPersonalityLabels[
                        previewItem.personality as keyof typeof brandPersonalityLabels
                      ] ?? previewItem.personality}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      seeded
                    </span>
                  {previewItem.seed ? <span>seed {previewItem.seed}</span> : null}
                  <span className="text-muted-foreground">{previewItem.model}</span>
                  <span className="text-muted-foreground">{previewItem.provider}</span>
                  </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={acceptingId === previewItem.id}
                    onClick={() => {
                      handleSeedAccept(previewItem.id).then(() => setPreviewItem(null));
                    }}
                  >
                    {acceptingId === previewItem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={discardingId === previewItem.id}
                    onClick={() => {
                      handleSeedDiscard(previewItem.id).then(() => setPreviewItem(null));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Discard
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="min-w-[140px]">
          <SelectValue placeholder={`All ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option === "all"
                ? "All"
                : brandPersonalityLabels[option as keyof typeof brandPersonalityLabels] ??
                  option.charAt(0).toUpperCase() + option.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
