"use client";

interface DragOverlayProps {
  visible: boolean;
}

export function DragOverlay({ visible }: DragOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-foreground/[0.08] bg-background px-12 py-10">
        <p className="text-[15px] font-medium tracking-[-0.01em] text-foreground/70">
          Drop your image
        </p>
        <p className="text-[12px] text-foreground/40">
          PNG, JPG, WebP, or SVG
        </p>
      </div>
    </div>
  );
}
