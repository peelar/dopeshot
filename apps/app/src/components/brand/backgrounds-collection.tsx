"use client";

import { useCallback, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { personalBackgroundsAtom } from "@/hooks/atoms/backgrounds";
import { deletePersonalBackground } from "@/domain/backgrounds/background-service";
import { useBackgroundUpload } from "@/hooks/use-background-upload";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/utils/toast";
import { cn } from "@/lib/utils/cn";
import { MAX_BRAND_BACKGROUNDS } from "@/domain/backgrounds/constants";
import type { PersonalBackground } from "@/domain/backgrounds/types";

export function BackgroundsCollection() {
  const [backgrounds, setBackgrounds] = useAtom(personalBackgroundsAtom);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use shared upload hook
  const { upload, isUploading } = useBackgroundUpload({
    showToasts: true,
    trackAnalytics: true,
    onSuccess: (result) => {
      setBackgrounds((prev) => [result.background, ...prev]);
    },
  });

  // Backgrounds live in local Jotai state for this session.

  const handleUpload = useCallback(
    async (file: File) => {
      if (backgrounds.length >= MAX_BRAND_BACKGROUNDS) {
        toast.error(`You can upload up to ${MAX_BRAND_BACKGROUNDS} backgrounds.`);
        return;
      }

      await upload(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [backgrounds.length, upload],
  );

  const handleDelete = useCallback(
    async (background: PersonalBackground) => {
      setDeletingId(background.id);

      try {
        await deletePersonalBackground(background.id);
        setBackgrounds((prev) => prev.filter((b) => b.id !== background.id));
        track("brand_background_deleted");
        toast.success("Background deleted");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete background";
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [setBackgrounds],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload],
  );

  const canUpload = backgrounds.length < MAX_BRAND_BACKGROUNDS;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-semibold">Brand Backgrounds</span>
        </div>
        <p className="text-xs text-muted-foreground">Custom backgrounds to match your brand.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload background"
      />

      <div className="grid grid-cols-3 gap-3">
        {backgrounds.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md p-0 transition focus-visible:ring-2 focus-visible:ring-offset-2 ring-1 ring-border/60 hover:ring-border",
              isUploading && "cursor-not-allowed opacity-50",
            )}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="h-5 w-5 text-muted-foreground transition group-hover:text-foreground" />
            )}
          </button>
        ) : (
          <>
            {backgrounds.map((background) => (
              <BackgroundThumbnail
                key={background.id}
                background={background}
                isDeleting={deletingId === background.id}
                onDelete={() => handleDelete(background)}
              />
            ))}

            {canUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md p-0 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2 ring-1 ring-border/60 hover:ring-border",
                  isUploading && "cursor-not-allowed opacity-50",
                )}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Plus className="h-5 w-5 text-muted-foreground transition group-hover:text-foreground" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

interface BackgroundThumbnailProps {
  background: PersonalBackground;
  isDeleting: boolean;
  onDelete: () => void;
}

function BackgroundThumbnail({
  background,
  isDeleting,
  onDelete,
}: BackgroundThumbnailProps) {
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

      {/* Delete overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:pointer-events-auto group-hover:bg-black/50 group-hover:opacity-100">
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-50"
          aria-label="Delete background"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
