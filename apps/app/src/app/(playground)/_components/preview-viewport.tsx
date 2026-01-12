"use client";

import { ReactNode, useLayoutEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

interface PreviewViewportProps {
  children: ReactNode;
  className?: string;
  surfaceWidth?: number;
  surfaceHeight?: number;
  isLoading?: boolean;
  loadingText?: string;
  fluidLayout?: boolean; // For content-based sizing (code snippet)
  onViewportMetricsChange?: (metrics: {
    scale: number;
    containerWidth: number;
    containerHeight: number;
    scaledWidth: number;
    scaledHeight: number;
    bottomWhitespace: number;
  }) => void;
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
  fluidLayout = false,
  onViewportMetricsChange,
}: PreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [hasMeasured, setHasMeasured] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  const reportMetrics = useCallback(
    (nextScale: number, containerWidth: number, containerHeight: number) => {
      const scaledWidth = surfaceWidth * nextScale;
      const scaledHeight = surfaceHeight * nextScale;
      const bottomWhitespace = Math.max(0, containerHeight - scaledHeight);

      onViewportMetricsChange?.({
        scale: nextScale,
        containerWidth,
        containerHeight,
        scaledWidth,
        scaledHeight,
        bottomWhitespace,
      });
    },
    [onViewportMetricsChange, surfaceHeight, surfaceWidth]
  );

  // Throttled scale update using requestAnimationFrame
  const updateScale = useCallback(() => {
    if (rafRef.current) return; // Already scheduled

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined;
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      if (!containerWidth || !surfaceWidth || !surfaceHeight) return;

      // Scale to fit both width and height, ensuring entire canvas is visible without scrolling
      const scaleX = containerWidth / surfaceWidth;
      const scaleY = containerHeight ? containerHeight / surfaceHeight : Number.POSITIVE_INFINITY;
      const nextScale = Math.min(scaleX, scaleY, 1);

      setScale(nextScale);
      setHasMeasured(true);
      reportMetrics(nextScale, containerWidth, containerHeight);
    });
  }, [surfaceWidth, surfaceHeight, reportMetrics]);

  useLayoutEffect(() => {
    if (fluidLayout) {
      setHasMeasured(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    // Initial scale calculation - fit both width and height
    const containerWidth = node.clientWidth;
    const containerHeight = node.clientHeight;
    if (containerWidth && surfaceWidth && surfaceHeight) {
      const scaleX = containerWidth / surfaceWidth;
      const scaleY = containerHeight ? containerHeight / surfaceHeight : Number.POSITIVE_INFINITY;
      const nextScale = Math.min(scaleX, scaleY, 1);
      
      setScale(nextScale);
      setHasMeasured(true);
      reportMetrics(nextScale, containerWidth, containerHeight);
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [surfaceWidth, surfaceHeight, updateScale, fluidLayout, reportMetrics]);

  // Fluid layout: content determines size, no fixed canvas
  if (fluidLayout) {
    return (
      <div
        ref={containerRef}
        className={cn("flex h-full w-full items-center justify-center", className)}
      >
        <div className="relative overflow-hidden rounded-lg">
          {children}
          {isLoading && <LoadingOverlay text={loadingText} />}
        </div>
      </div>
    );
  }

  // Fixed canvas: scale to fit container
  return (
    <div
      ref={containerRef}
      className={cn("flex h-full w-full justify-center", className)}
    >
      <div
        data-testid="preview-canvas"
        className="relative overflow-hidden rounded-lg shadow-sm"
        style={{
          width: hasMeasured ? surfaceWidth * scale : undefined,
          height: hasMeasured ? surfaceHeight * scale : undefined,
          aspectRatio: `${surfaceWidth} / ${surfaceHeight}`,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
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
        {isLoading && <LoadingOverlay text={loadingText} />}
      </div>
    </div>
  );
}
