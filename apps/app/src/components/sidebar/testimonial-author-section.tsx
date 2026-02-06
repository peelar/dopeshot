"use client";

import { useCallback, useRef, type ChangeEvent } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "@/hooks/atoms";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";
import { User, X } from "lucide-react";

interface TestimonialAuthorSectionProps {
  onUploadAsset?: (file: File, kind: "avatar") => void;
}

function StarButton({
  filled,
  onClick,
  index,
}: {
  filled: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-0.5 transition-colors",
        filled
          ? "text-amber-400 hover:text-amber-500"
          : "text-muted-foreground/30 hover:text-amber-300",
      )}
      aria-label={`Set rating to ${index + 1} star${index === 0 ? "" : "s"}`}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

export function TestimonialAuthorSection({ onUploadAsset }: TestimonialAuthorSectionProps) {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const testimonial = config.layoutSpecificSettings?.testimonial;
  const authorName = testimonial?.authorName ?? "";
  const authorTitle = testimonial?.authorTitle ?? "";
  const authorCompany = testimonial?.authorCompany ?? "";
  const starRating = testimonial?.starRating ?? 0;
  const hasAvatar = !!testimonial?.authorAvatarAssetId;

  const updateField = useCallback(
    (field: string, value: string | number | undefined) => {
      setConfig((prev) => ({
        ...prev,
        layoutSpecificSettings: {
          ...prev.layoutSpecificSettings,
          testimonial: {
            ...prev.layoutSpecificSettings?.testimonial,
            [field]: value,
          },
        },
      }));

      track("testimonial_author_edited", {
        field,
      });
    },
    [setConfig],
  );

  const handleStarClick = useCallback(
    (index: number) => {
      // Clicking same star toggles off (sets to 0)
      const newRating = starRating === index + 1 ? 0 : index + 1;
      updateField("starRating", newRating);
    },
    [starRating, updateField],
  );

  const handleAvatarUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUploadAsset) {
        onUploadAsset(file, "avatar");
      }
      if (e.target) e.target.value = "";
    },
    [onUploadAsset],
  );

  const handleRemoveAvatar = useCallback(() => {
    updateField("authorAvatarAssetId", undefined);
  }, [updateField]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Author name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="author-name" className="text-xs font-medium text-muted-foreground">
          Name
        </Label>
        <input
          id="author-name"
          type="text"
          value={authorName}
          onChange={(e) => updateField("authorName", e.target.value)}
          placeholder="Jane Smith"
          maxLength={60}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>

      {/* Author title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="author-title" className="text-xs font-medium text-muted-foreground">
          Title
        </Label>
        <input
          id="author-title"
          type="text"
          value={authorTitle}
          onChange={(e) => updateField("authorTitle", e.target.value)}
          placeholder="CEO"
          maxLength={60}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>

      {/* Company */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="author-company" className="text-xs font-medium text-muted-foreground">
          Company
        </Label>
        <input
          id="author-company"
          type="text"
          value={authorCompany}
          onChange={(e) => updateField("authorCompany", e.target.value)}
          placeholder="Acme Inc."
          maxLength={60}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>

      {/* Star rating */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">Rating</Label>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <StarButton key={i} filled={i < starRating} onClick={() => handleStarClick(i)} index={i} />
          ))}
          {starRating > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">{starRating}/5</span>
          )}
        </div>
      </div>

      {/* Avatar upload */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">Avatar</Label>
        <input
          type="file"
          ref={avatarInputRef}
          className="hidden"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatarUpload}
          aria-hidden="true"
          tabIndex={-1}
        />
        {hasAvatar ? (
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-xs text-muted-foreground hover:text-destructive"
              aria-label="Remove avatar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={!onUploadAsset}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border transition-colors",
              onUploadAsset
                ? "cursor-pointer hover:border-primary/40 hover:bg-muted/40"
                : "cursor-not-allowed opacity-50",
            )}
            aria-label="Upload avatar"
          >
            <User className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
