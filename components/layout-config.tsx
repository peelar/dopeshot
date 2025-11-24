"use client";

import { LayoutConfig } from "@/domain/layout/types";
import { TEMPLATES, getTemplateById } from "@/domain/layout/templates";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Asset } from "@/domain/asset/types";

interface LayoutConfigProps {
  config: LayoutConfig;
  onChange: (newConfig: LayoutConfig) => void;
  assets?: Asset[];
  activeAssetId?: string;
}

export const LayoutConfigPanel = ({
  config,
  onChange,
  assets = [],
  activeAssetId,
}: LayoutConfigProps) => {
  const currentTemplate = getTemplateById(config.templateId);

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      const newConfig = template.createConfig();

      // Preserve active asset if available
      if (activeAssetId) {
        newConfig.assets.screenshot = activeAssetId;
      }

      onChange(newConfig);
    }
  };

  const handleVariantChange = (variant: string) => {
    onChange({ ...config, variant });
  };

  const handleTextChange = (field: "title" | "subtitle", value: string) => {
    onChange({
      ...config,
      text: { ...config.text, [field]: value },
    });
  };

  const handleAssetChange = (field: "screenshot" | "logo", assetId: string) => {
    onChange({
      ...config,
      assets: { ...config.assets, [field]: assetId === "__none__" ? undefined : assetId },
    });
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Layout</h3>

      <div className="flex-1 space-y-6 overflow-y-auto py-2">
        {/* Template Selection */}
        <div>
          <Label className="mb-2 text-xs text-slate-500">Template</Label>
          <div className="grid gap-2">
            {TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={config.templateId === template.id ? "default" : "outline"}
                className="h-auto flex-col items-start p-3 text-left"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <span className="font-semibold">{template.name}</span>
                <span className="text-xs text-slate-500">{template.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Layout Variant */}
        {currentTemplate && currentTemplate.variants.length > 0 && (
          <div>
            <Label className="mb-2 text-xs text-slate-500">Layout</Label>
            <Select value={config.variant} onValueChange={handleVariantChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                {currentTemplate.variants.map((v) => {
                  const labelMap: Record<string, string> = {
                    left: "Photo on the left",
                    right: "Photo on the right",
                    center: "Photo in the center",
                  };
                  return (
                    <SelectItem key={v} value={v}>
                      {labelMap[v] || v.charAt(0).toUpperCase() + v.slice(1)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Text Inputs */}
        <div className="space-y-3">
          <div>
            <Label className="mb-2 text-xs text-slate-500">Title</Label>
            <Input
              value={config.text.title}
              onChange={(e) => handleTextChange("title", e.target.value)}
              placeholder="Project Title"
            />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-500">Subtitle</Label>
            <Input
              value={config.text.subtitle || ""}
              onChange={(e) => handleTextChange("subtitle", e.target.value)}
              placeholder="A short description"
            />
          </div>
        </div>

        {/* Assets */}
        <div className="space-y-3">
          <div>
            <Label className="mb-2 text-xs text-slate-500">Screenshot</Label>
            <Select
              value={config.assets.screenshot || "__none__"}
              onValueChange={(v: string) => handleAssetChange("screenshot", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select screenshot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {assets
                  .filter((a) => a.kind === "screenshot")
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-500">Logo</Label>
            <Select
              value={config.assets.logo || "__none__"}
              onValueChange={(v: string) => handleAssetChange("logo", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select logo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {assets
                  .filter((a) => a.kind === "logo")
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
