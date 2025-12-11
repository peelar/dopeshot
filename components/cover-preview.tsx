"use client";

import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { canvasAtom, currentLookAtom } from "@/hooks/atoms/derived";
import { getLookComponent } from "@/components/looks/registry";

interface CoverPreviewProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

export function CoverPreview({ className, onUploadAsset, isStatic = false }: CoverPreviewProps) {
  const look = useAtomValue(currentLookAtom);
  const canvasDimensions = useAtomValue(canvasAtom);

  if (!look) {
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

  const LookComponent = getLookComponent(look.id);

  if (!LookComponent) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white",
          isStatic ? "" : "rounded-lg",
          className,
        )}
        style={{ aspectRatio: "1280 / 720" }}
      >
        <span className="text-sm text-slate-500">Component not found</span>
      </div>
    );
  }

  // Code snippet look should not have fixed aspect ratio
  const useFluidLayout = look.id === "code-snippet";

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
      <LookComponent onUploadAsset={onUploadAsset} isStatic={isStatic} />
    </div>
  );
}
