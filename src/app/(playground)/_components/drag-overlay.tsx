"use client";

interface DragOverlayProps {
  visible: boolean;
}

export function DragOverlay({ visible }: DragOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/15">
      <div className="rounded-2xl border-4 border-dashed border-blue-400 bg-white/80 px-10 py-8 text-center shadow-2xl">
        <p className="text-2xl font-semibold text-slate-900">Drop your screenshot here</p>
        <p className="text-sm text-slate-600">PNG, JPG, WebP, or SVG · Max 10MB</p>
      </div>
    </div>
  );
}
