"use client";

import { type MemoryItemDTO } from "@/domain/memory/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MemoryItemProps {
  item: MemoryItemDTO;
  isLoaded?: boolean;
  onClick?: () => void;
}

export function MemoryItem({ item, isLoaded = false, onClick }: MemoryItemProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
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
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border p-2 transition-all",
        "bg-muted hover:bg-muted/60",
        isLoaded && "ring-2 ring-primary ring-offset-2",
      )}
      aria-label="Load history item"
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
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Date */}
        <p className="text-sm font-normal">
          {formatDate(item.createdAt)}
        </p>

        {/* Shared badge */}
        {item.isShared && (
          <span className="mt-1 w-fit rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
            Shared
          </span>
        )}
      </div>
    </button>
  );
}
