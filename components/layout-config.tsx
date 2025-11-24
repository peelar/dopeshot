"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
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
import { UploadCloud } from "lucide-react";

interface LayoutConfigProps {
  config: LayoutConfig;
  onConfigChangeAction: (newConfig: LayoutConfig) => void;
  assets?: Asset[];
  activeAssetId?: string;
  onUploadAsset?: (file: File) => void;
}

export const LayoutConfigPanel = ({
  config,
  onConfigChangeAction,
  assets = [],
  activeAssetId,
  onUploadAsset,
}: LayoutConfigProps) => {
  const currentTemplate = getTemplateById(config.templateId);
  const screenshotAsset = config.assets.screenshot
    ? assets.find((asset) => asset.id === config.assets.screenshot)
    : undefined;

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      const newConfig = template.createConfig();

      // Preserve active asset if available
      if (activeAssetId) {
        newConfig.assets.screenshot = activeAssetId;
      }

      onConfigChangeAction(newConfig);
    }
  };

  const handleVariantChange = (variant: string) => {
    onConfigChangeAction({ ...config, variant });
  };

  const handleTextChange = (field: "title" | "subtitle", value: string) => {
    onConfigChangeAction({
      ...config,
      text: { ...config.text, [field]: value },
    });
  };

  const handleAssetChange = (field: "screenshot" | "logo", assetId: string) => {
    onConfigChangeAction({
      ...config,
      assets: { ...config.assets, [field]: assetId === "__none__" ? undefined : assetId },
    });
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Layout</h3>

      <div className="flex-1 space-y-6 overflow-y-auto py-2">
        {/* Template Selection */}
        <div>
          <Label className="mb-2 text-xs text-slate-500 dark:text-slate-400">Template</Label>
          <div className="grid gap-2">
            {TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={config.templateId === template.id ? "default" : "outline"}
                className="h-auto flex-col items-start p-3 text-left"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <span
                  className={`font-semibold ${
                    config.templateId === template.id
                      ? "text-slate-50 dark:text-slate-50"
                      : "text-slate-900 dark:text-slate-50"
                  }`}
                >
                  {template.name}
                </span>
                <span
                  className={`text-xs ${
                    config.templateId === template.id
                      ? "text-slate-200 dark:text-slate-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {template.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Layout Variant */}
        {currentTemplate && currentTemplate.variants.length > 0 && (
          <div>
            <Label className="mb-2 text-xs text-slate-500 dark:text-slate-400">Layout</Label>
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
            <Label className="mb-2 text-xs text-slate-500 dark:text-slate-400">Title</Label>
            <Input
              value={config.text.title}
              onChange={(e) => handleTextChange("title", e.target.value)}
              placeholder="Project Title"
            />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-500 dark:text-slate-400">Subtitle</Label>
            <Input
              value={config.text.subtitle || ""}
              onChange={(e) => handleTextChange("subtitle", e.target.value)}
              placeholder="A short description"
            />
          </div>
        </div>

        {/* Assets */}
        <div className="space-y-4">
          <div>
            <Label className="mb-2 text-xs text-slate-500 dark:text-slate-400">Screenshot</Label>
            <ScreenshotDropzone
              asset={screenshotAsset}
              onUpload={onUploadAsset}
              disabled={!onUploadAsset}
            />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-500 dark:text-slate-400">Logo</Label>
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

interface ScreenshotDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File) => void;
  disabled?: boolean;
}

const ScreenshotDropzone = ({ asset, onUpload, disabled }: ScreenshotDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File) => {
    if (!file || !onUpload) return;
    onUpload(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex flex-col gap-3 rounded-lg border-2 border-dashed p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600 ${
        isDragging
          ? "border-slate-400 bg-slate-50 dark:border-slate-600 dark:bg-slate-900"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className="flex items-center gap-3">
        {asset ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="h-16 w-20 rounded-md object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-16 w-20 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
            <UploadCloud className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {asset
              ? "Click or drop to replace the screenshot"
              : "Click or drop to upload a screenshot"}
          </p>
          {asset ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{`Current file: ${asset.name}`}</p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">PNG or JPG up to 10MB</p>
          )}
        </div>
      </div>
    </div>
  );
};
