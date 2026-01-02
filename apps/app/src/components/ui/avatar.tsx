"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * User's name to generate initials from
   */
  name?: string;
  /**
   * Image URL for the avatar
   */
  src?: string;
  /**
   * Alt text for the image
   */
  alt?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Get initials from a name
 * @param name - Full name or email
 * @returns Up to 2 initials
 */
function getInitials(name: string): string {
  if (!name) return "?";

  // Handle email addresses - use first letter
  if (name.includes("@")) {
    return name.charAt(0).toUpperCase();
  }

  // Split name and get first letter of first two words
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export function Avatar({
  name,
  src,
  alt,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const initials = name ? getInitials(name) : "?";
  const showImage = src && !imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-muted text-muted-foreground font-medium select-none",
        "border border-border/40",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="leading-none">{initials}</span>
      )}
    </div>
  );
}
