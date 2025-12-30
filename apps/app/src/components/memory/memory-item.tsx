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
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-lg border transition-all",
        "hover:ring-2 hover:ring-primary hover:ring-offset-2",
        isLoaded && "ring-2 ring-primary ring-offset-2",
        "bg-muted",
      )}
      aria-label="Load memory item"
    >
      <Image
        src={item.screenshotUrl}
        alt="Memory screenshot"
        fill
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 300px, 300px"
      />

      {/* Timestamp overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-xs text-white">
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Loaded indicator */}
      {isLoaded && (
        <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
          Current
        </div>
      )}

      {/* Shared indicator */}
      {item.isShared && (
        <div className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white">
          Shared
        </div>
      )}
    </button>
  );
}
