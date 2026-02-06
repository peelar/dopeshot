"use client";

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "@/hooks/atoms";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";

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

/**
 * Content section: Quote text + star rating (what the audience reads first).
 */
export function TestimonialContentSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);

  const quoteText = config.text.title ?? "";
  const starRating = config.layoutSpecificSettings?.testimonial?.starRating ?? 0;

  const handleQuoteChange = useCallback(
    (value: string) => {
      setConfig((prev) => ({
        ...prev,
        text: { ...prev.text, title: value },
      }));
    },
    [setConfig],
  );

  const handleStarClick = useCallback(
    (index: number) => {
      const newRating = starRating === index + 1 ? 0 : index + 1;
      setConfig((prev) => ({
        ...prev,
        layoutSpecificSettings: {
          ...prev.layoutSpecificSettings,
          testimonial: {
            ...prev.layoutSpecificSettings?.testimonial,
            starRating: newRating,
          },
        },
      }));
      track("testimonial_author_edited", { field: "starRating" });
    },
    [starRating, setConfig],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="testimonial-quote" className="text-xs font-medium text-muted-foreground">
          Quote
        </Label>
        <textarea
          id="testimonial-quote"
          value={quoteText}
          onChange={(e) => handleQuoteChange(e.target.value)}
          placeholder="This product changed everything..."
          rows={3}
          maxLength={200}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>

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
    </div>
  );
}

/**
 * Author section: Name, title, company, avatar (who said it).
 */
export function TestimonialAuthorSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);

  const testimonial = config.layoutSpecificSettings?.testimonial;
  const authorName = testimonial?.authorName ?? "";
  const authorTitle = testimonial?.authorTitle ?? "";
  const authorCompany = testimonial?.authorCompany ?? "";

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

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Name */}
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

      {/* Title */}
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

    </div>
  );
}
