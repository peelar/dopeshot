import { LayoutConfig } from "@/domain/layout/types";
import { getTemplateById } from "@/domain/layout/templates";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";

interface CoverPreviewProps {
  config: LayoutConfig;
  className?: string;
  assets?: Asset[];
  onTextChange?: (field: "title" | "subtitle", value: string) => void;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

export function CoverPreview({
  config,
  className,
  assets = [],
  onTextChange,
  onUploadAsset,
  isStatic = false,
}: CoverPreviewProps) {
  const template = getTemplateById(config.templateId);

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
        aspectRatio: "1280 / 720",
      }}
    >
      <TemplateComponent
        config={config}
        assets={assets}
        onTextChange={onTextChange}
        onUploadAsset={onUploadAsset}
        isStatic={isStatic}
      />
    </div>
  );
}
