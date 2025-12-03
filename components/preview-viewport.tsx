"use client";

import { ReactNode, useLayoutEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/utils";
import { Loader2 } from "lucide-react";

interface PreviewViewportProps {
  children: ReactNode;
  className?: string;
  surfaceWidth?: number;
  surfaceHeight?: number;
  isLoading?: boolean;
  loadingText?: string;
}

const DEFAULT_SURFACE = {
  width: 1200,
  height: 630,
};

export function PreviewViewport({
  children,
  className,
  surfaceWidth = DEFAULT_SURFACE.width,
  surfaceHeight = DEFAULT_SURFACE.height,
  isLoading = false,
  loadingText = "Loading...",
}: PreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [hasMeasured, setHasMeasured] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  // Throttled scale update using requestAnimationFrame
  const updateScale = useCallback(() => {
    if (rafRef.current) return; // Already scheduled

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined;
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (!width || !surfaceWidth) return;
      const nextScale = Math.min(width / surfaceWidth, 1);
      setScale(nextScale);
      setHasMeasured(true);
    });
  }, [surfaceWidth]);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Initial scale calculation
    const width = node.clientWidth;
    if (width && surfaceWidth) {
      const nextScale = Math.min(width / surfaceWidth, 1);
      setScale(nextScale);
      setHasMeasured(true);
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [surfaceWidth, updateScale]);

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full w-full items-center justify-center", className)}
    >
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{ aspectRatio: `${surfaceWidth} / ${surfaceHeight}`, maxWidth: surfaceWidth }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: surfaceWidth,
            height: surfaceHeight,
            transform: `scale(${scale})`,
            opacity: hasMeasured ? 1 : 0,
            transition: "opacity 150ms ease",
          }}
        >
          {children}
        </div>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-2xl">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{loadingText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
