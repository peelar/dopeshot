"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, Check, X, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/utils/toast";
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

type AdminCatalogItem = {
  id: string;
  personality: string;
  status: string;
  previewUrl: string | null;
  createdAt: string;
};

const statusOptions: StatusFilter[] = [
  "pending",
  "approved",
  "published",
  "rejected",
  "all",
];

export function AiBackgroundPlayground() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [personalityFilter, setPersonalityFilter] = useState<string>("all");
  const [items, setItems] = useState<AdminCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCatalog = useCallback(
    async ({ refresh = false }: { refresh?: boolean } = {}) => {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (personalityFilter) params.set("personality", personalityFilter);
        params.set("limit", "60");

        const response = await fetch(`/api/backgrounds/catalog/admin?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load catalog");
        }
        setItems(payload.items ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load catalog";
        toast.error(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [personalityFilter, statusFilter],
  );

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const handleStatusUpdate = useCallback(
    async (id: string, status: Exclude<StatusFilter, "all">) => {
      setUpdatingId(id);
      try {
        const response = await fetch("/api/backgrounds/catalog/admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to update background");
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
      if (!response.ok && response.status !== 204) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Delete failed");
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

  const filteredCount = useMemo(() => items.length, [items]);

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
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
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
            onClick={() => fetchCatalog({ refresh: true })}
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
          <div className="text-xs text-muted-foreground">{filteredCount} items</div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
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
                    {brandPersonalityLabels[item.personality as keyof typeof brandPersonalityLabels] ??
                      item.personality}
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
          )}
        </section>
      </div>
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
