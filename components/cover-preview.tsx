"use client";

import { useAtomValue } from "jotai";
import { cn } from "@/utils";
import { canvasAtom, currentTemplateAtom } from "@/hooks/atoms/derived";

interface CoverPreviewProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

export function CoverPreview({ className, onUploadAsset, isStatic = false }: CoverPreviewProps) {
  const template = useAtomValue(currentTemplateAtom);
  const canvasDimensions = useAtomValue(canvasAtom);

  if (!template) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white",
          isStatic ? "" : "rounded-lg",
          className,
        )}
        style={{ aspectRatio: "1280 / 720" }}
      >
        <span className="text-sm text-slate-500">Template not found</span>
      </div>
    );
  }

  const TemplateComponent = template.component;

  return (
    <div
      className={cn("relative w-full overflow-hidden", isStatic ? "" : "rounded-lg", className)}
      style={{
        aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
      }}
    >
      <TemplateComponent onUploadAsset={onUploadAsset} isStatic={isStatic} />
    </div>
  );
}
