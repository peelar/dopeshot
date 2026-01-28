"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AdrianAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

/**
 * Adrian's personal avatar component for building connection and trust
 */
export function AdrianAvatar({ size = "md", className, ...props }: AdrianAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-border/20",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {!imageError ? (
        <img
          src="/me.jpg"
          alt="Adrian from dopeshot"
          className="h-full w-full scale-150 object-cover object-[center_15%]"
          onError={() => setImageError(true)}
        />
      ) : (
        // Fallback to initials if image doesn't load
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-medium text-sm">
          AP
        </div>
      )}
    </div>
  );
}
