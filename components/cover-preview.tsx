import { LayoutConfig } from "@/domain/layout/types";
import { getTemplateById } from "@/domain/layout/templates";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";

interface CoverPreviewProps {
  config: LayoutConfig;
  className?: string;
  assets?: Asset[];
}

export function CoverPreview({ config, className, assets = [] }: CoverPreviewProps) {
  const template = getTemplateById(config.templateId);

  if (!template) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-slate-200 bg-white",
          className,
        )}
        style={{ aspectRatio: "1200 / 630" }}
      >
        <span className="text-sm text-slate-500">Template not found</span>
      </div>
    );
  }

  const TemplateComponent = template.component;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-slate-200",
        className,
      )}
      style={{
        aspectRatio: "1200 / 630",
      }}
    >
      <TemplateComponent config={config} assets={assets} />
    </div>
  );
}
