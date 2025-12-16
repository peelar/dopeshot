"use client";

import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { canvasAtom, currentLayoutAtom } from "@/hooks/atoms/derived";
import { getLayoutComponent } from "@/components/layouts/registry";

interface CoverPreviewProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

export function CoverPreview({ className, onUploadAsset, isStatic = false }: CoverPreviewProps) {
  const layout = useAtomValue(currentLayoutAtom);
  const canvasDimensions = useAtomValue(canvasAtom);

  if (!layout) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white",
          isStatic ? "" : "rounded-lg",
          className,
        )}
        style={{ aspectRatio: "1280 / 720" }}
      >
        <span className="text-sm text-slate-500">Look not found</span>
      </div>
    );
  }

  // getLayoutComponent throws an error if component is not found
  // This ensures we catch missing component registrations immediately
  const LayoutComponent = getLayoutComponent(layout.id);

  // Code snippet look should not have fixed aspect ratio
  const useFluidLayout = layout.id === "code-snippet";

  return (
    <div
      className={cn("relative w-full overflow-hidden", isStatic ? "" : "rounded-lg", className)}
      style={
        useFluidLayout
          ? undefined
          : {
              aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
            }
      }
    >
      <LayoutComponent onUploadAsset={onUploadAsset} isStatic={isStatic} />
    </div>
  );
}
