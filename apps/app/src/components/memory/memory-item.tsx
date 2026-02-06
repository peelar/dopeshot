"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { type MemoryItemDTO } from "@/domain/memory/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MemoryItemProps {
  item: MemoryItemDTO;
  isLoaded?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export function MemoryItem({ item, isLoaded = false, onClick, onDelete }: MemoryItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const formatLabel = item.format === "testimonial" ? "Testimonial" : "Screenshot";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (onDelete) {
      onDelete();
    }
  };
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Check if today
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `Today, ${time}`;
    }

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isYesterday) {
      return `Yesterday, ${time}`;
    }

    // For older dates, show full date
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });

    // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const suffix = (day: number) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return `${month} ${day}${suffix(day)}, ${time}`;
  };

  return (
    <div
      className="relative group/item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg border p-2 transition-all",
          "bg-muted hover:bg-muted/60",
          isLoaded && "ring-2 ring-primary ring-offset-2",
        )}
        aria-label="Load saved design"
      >
        {/* Thumbnail */}
        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={item.screenshotUrl}
            alt="History screenshot"
            fill
            className="object-cover"
            sizes="80px"
          />

          {/* Subtle overlay on hover with delete action */}
          {isHovered && onDelete && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
              <button
                onClick={handleDelete}
                className={cn(
                  "rounded-md p-1.5 transition-all",
                  "bg-white/10 hover:bg-white/20",
                  "text-white/90 hover:text-white",
                  "ring-1 ring-white/20 hover:ring-white/30",
                )}
                aria-label="Delete saved design"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-sm font-normal">{formatDate(item.createdAt)}</p>

          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                "w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                item.format === "testimonial"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-sky-100 text-sky-800",
              )}
            >
              {formatLabel}
            </span>
            {item.isShared ? (
              <span className="w-fit rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                Shared
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </div>
  );
}
