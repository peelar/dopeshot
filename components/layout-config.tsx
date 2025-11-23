"use client";

import { useState } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { TEMPLATES, getTemplateById } from "@/domain/layout/templates";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Asset } from "@/domain/asset/types";

interface LayoutConfigProps {
  config: LayoutConfig;
  onChange: (newConfig: LayoutConfig) => void;
  assets?: Asset[];
  activeAssetId?: string;
}

const NativeSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

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
      assets: { ...config.assets, [field]: assetId || undefined },
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
            <NativeSelect
              value={config.variant}
              onChange={handleVariantChange}
              options={currentTemplate.variants.map((v) => {
                const labelMap: Record<string, string> = {
                  left: "Photo on the left",
                  right: "Photo on the right",
                  center: "Photo in the center",
                };
                return {
                  value: v,
                  label: labelMap[v] || v.charAt(0).toUpperCase() + v.slice(1),
                };
              })}
            />
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
            <NativeSelect
              value={config.assets.screenshot || ""}
              onChange={(v) => handleAssetChange("screenshot", v)}
              options={[
                { value: "", label: "None" },
                ...assets
                  .filter((a) => a.kind === "screenshot")
                  .map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-500">Logo</Label>
            <NativeSelect
              value={config.assets.logo || ""}
              onChange={(v) => handleAssetChange("logo", v)}
              options={[
                { value: "", label: "None" },
                ...assets
                  .filter((a) => a.kind === "logo")
                  .map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
