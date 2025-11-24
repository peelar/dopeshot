"use client";

import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/utils";

interface PreviewViewportProps {
  children: ReactNode;
  className?: string;
  surfaceWidth?: number;
  surfaceHeight?: number;
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
}: PreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (!width || !surfaceWidth) return;
      const nextScale = Math.min(width / surfaceWidth, 1);
      setScale(nextScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(node);

    return () => observer.disconnect();
  }, [surfaceWidth]);

  return (
    <div ref={containerRef} className={cn("flex h-full w-full items-center justify-center", className)}>
      <div className="relative w-full" style={{ aspectRatio: `${surfaceWidth} / ${surfaceHeight}`, maxWidth: surfaceWidth }}>
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: surfaceWidth,
            height: surfaceHeight,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}


