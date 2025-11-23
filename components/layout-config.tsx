"use client";

import { useState } from "react";
import {
  LayoutConfig,
  LayoutPrimitive,
  TextBlockPrimitive,
  ScreenshotPrimitive,
  BackgroundPrimitive,
} from "@/domain/layout/types";
import { TEMPLATES } from "@/domain/layout/templates";
import { updatePrimitive } from "@/domain/layout/engine";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
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
  const [selectedPrimitiveId, setSelectedPrimitiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "customize">("templates");

  const handleTemplateSelect = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      const newConfig = template.createConfig();

      // If we have an active asset, preserve it in the new template's screenshot primitive
      if (activeAssetId) {
        const screenshotPrim = newConfig.primitives.find((p) => p.type === "screenshot");
        if (screenshotPrim) {
          newConfig.primitives = newConfig.primitives.map((p) =>
            p.id === screenshotPrim.id ? { ...p, assetId: activeAssetId } : p,
          );
        }
      }

      onChange(newConfig);
      setSelectedPrimitiveId(null);
    }
  };

  const handlePrimitiveUpdate = (id: string, updates: Partial<LayoutPrimitive>) => {
    const newConfig = updatePrimitive(config, id, updates);
    onChange(newConfig);
  };

  const selectedPrimitive = config.primitives.find((p) => p.id === selectedPrimitiveId);

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Configuration</h3>

      <div className="mb-4 grid w-full grid-cols-2 rounded-md bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
            activeTab === "templates"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900",
          )}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab("customize")}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
            activeTab === "customize"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900",
          )}
        >
          Customize
        </button>
      </div>

      {activeTab === "templates" ? (
        <div className="flex-1 space-y-4 overflow-y-auto py-2">
          <div className="grid gap-2">
            {TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto flex-col items-start p-3 text-left"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <span className="font-semibold">{template.name}</span>
                <span className="text-xs text-slate-500">{template.description}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto py-2">
          {!selectedPrimitive ? (
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Select an item to edit</Label>
              {config.primitives.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  className="w-full justify-start text-left capitalize"
                  onClick={() => setSelectedPrimitiveId(p.id)}
                >
                  {p.type === "textBlock" ? (p as TextBlockPrimitive).role : p.type}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-auto p-2 text-slate-500 hover:text-slate-900"
                onClick={() => setSelectedPrimitiveId(null)}
              >
                ← Back to items
              </Button>

              {selectedPrimitive.type === "textBlock" && (
                <TextBlockEditor
                  primitive={selectedPrimitive as TextBlockPrimitive}
                  onChange={(updates) => handlePrimitiveUpdate(selectedPrimitive.id, updates)}
                />
              )}

              {selectedPrimitive.type === "screenshot" && (
                <ScreenshotEditor
                  primitive={selectedPrimitive as ScreenshotPrimitive}
                  onChange={(updates) => handlePrimitiveUpdate(selectedPrimitive.id, updates)}
                  assets={assets}
                />
              )}

              {selectedPrimitive.type === "background" && (
                <BackgroundEditor
                  primitive={selectedPrimitive as BackgroundPrimitive}
                  onChange={(updates) => handlePrimitiveUpdate(selectedPrimitive.id, updates)}
                />
              )}

              <div className="border-t border-slate-100 pt-4">
                <Label className="text-xs font-semibold text-slate-900">Grid Position</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-slate-500">Col Start</Label>
                    <Input
                      type="number"
                      min={1}
                      max={13}
                      value={selectedPrimitive.gridColumnStart}
                      onChange={(e) =>
                        handlePrimitiveUpdate(selectedPrimitive.id, {
                          gridColumnStart: parseInt(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Col End</Label>
                    <Input
                      type="number"
                      min={1}
                      max={13}
                      value={selectedPrimitive.gridColumnEnd}
                      onChange={(e) =>
                        handlePrimitiveUpdate(selectedPrimitive.id, {
                          gridColumnEnd: parseInt(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Row Start</Label>
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={selectedPrimitive.gridRowStart}
                      onChange={(e) =>
                        handlePrimitiveUpdate(selectedPrimitive.id, {
                          gridRowStart: parseInt(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Row End</Label>
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={selectedPrimitive.gridRowEnd}
                      onChange={(e) =>
                        handlePrimitiveUpdate(selectedPrimitive.id, {
                          gridRowEnd: parseInt(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

const TextBlockEditor = ({
  primitive,
  onChange,
}: {
  primitive: TextBlockPrimitive;
  onChange: (updates: Partial<TextBlockPrimitive>) => void;
}) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-500">Text</Label>
        <Input
          value={primitive.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Role</Label>
        <NativeSelect
          value={primitive.role}
          onChange={(v) => onChange({ role: v as any })}
          options={[
            { value: "title", label: "Title" },
            { value: "subtitle", label: "Subtitle" },
            { value: "body", label: "Body" },
            { value: "badge", label: "Badge" },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-slate-500">Size</Label>
          <NativeSelect
            value={primitive.fontSizeToken}
            onChange={(v) => onChange({ fontSizeToken: v as any })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "XL" },
              { value: "2xl", label: "2XL" },
              { value: "3xl", label: "3XL" },
              { value: "4xl", label: "4XL" },
            ]}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Weight</Label>
          <NativeSelect
            value={primitive.fontWeightToken}
            onChange={(v) => onChange({ fontWeightToken: v as any })}
            options={[
              { value: "regular", label: "Regular" },
              { value: "medium", label: "Medium" },
              { value: "semibold", label: "Semibold" },
              { value: "bold", label: "Bold" },
            ]}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-slate-500">H. Align</Label>
          <NativeSelect
            value={primitive.horizontalAlign}
            onChange={(v) => onChange({ horizontalAlign: v as any })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">V. Align</Label>
          <NativeSelect
            value={primitive.verticalAlign}
            onChange={(v) => onChange({ verticalAlign: v as any })}
            options={[
              { value: "top", label: "Top" },
              { value: "middle", label: "Middle" },
              { value: "bottom", label: "Bottom" },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

const ScreenshotEditor = ({
  primitive,
  onChange,
  assets,
}: {
  primitive: ScreenshotPrimitive;
  onChange: (updates: Partial<ScreenshotPrimitive>) => void;
  assets: Asset[];
}) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-500">Image Asset</Label>
        <NativeSelect
          value={primitive.assetId || ""}
          onChange={(v) => onChange({ assetId: v })}
          options={[
            { value: "", label: "None" },
            ...assets.map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Shadow</Label>
        <NativeSelect
          value={primitive.shadowStyle}
          onChange={(v) => onChange({ shadowStyle: v as any })}
          options={[
            { value: "none", label: "None" },
            { value: "soft", label: "Soft" },
            { value: "hard", label: "Hard" },
          ]}
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Corner Radius</Label>
        <NativeSelect
          value={primitive.borderRadiusPx.toString()}
          onChange={(v) => onChange({ borderRadiusPx: parseInt(v) })}
          options={[
            { value: "0", label: "0px" },
            { value: "8", label: "8px" },
            { value: "16", label: "16px" },
            { value: "24", label: "24px" },
          ]}
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Crop</Label>
        <NativeSelect
          value={primitive.cropStyle}
          onChange={(v) => onChange({ cropStyle: v as any })}
          options={[
            { value: "full", label: "Full" },
            { value: "bottomCut", label: "Bottom Cut" },
          ]}
        />
      </div>
    </div>
  );
};

const BackgroundEditor = ({
  primitive,
  onChange,
}: {
  primitive: BackgroundPrimitive;
  onChange: (updates: Partial<BackgroundPrimitive>) => void;
}) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-500">Variant</Label>
        <NativeSelect
          value={primitive.variant}
          onChange={(v) => onChange({ variant: v as any })}
          options={[
            { value: "solid", label: "Solid" },
            { value: "gradientLinear", label: "Linear Gradient" },
          ]}
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Primary Color</Label>
        <NativeSelect
          value={primitive.colorPrimary}
          onChange={(v) => onChange({ colorPrimary: v })}
          options={[
            { value: "slate-50", label: "Slate 50" },
            { value: "slate-900", label: "Slate 900" },
            { value: "zinc-50", label: "Zinc 50" },
            { value: "zinc-900", label: "Zinc 900" },
            { value: "indigo-50", label: "Indigo 50" },
            { value: "indigo-950", label: "Indigo 950" },
            { value: "violet-500", label: "Violet 500" },
          ]}
        />
      </div>
      {primitive.variant === "gradientLinear" && (
        <div>
          <Label className="text-xs text-slate-500">Secondary Color</Label>
          <NativeSelect
            value={primitive.colorSecondary || "slate-200"}
            onChange={(v) => onChange({ colorSecondary: v })}
            options={[
              { value: "slate-200", label: "Slate 200" },
              { value: "slate-800", label: "Slate 800" },
              { value: "zinc-200", label: "Zinc 200" },
              { value: "indigo-400", label: "Indigo 400" },
              { value: "violet-400", label: "Violet 400" },
            ]}
          />
        </div>
      )}
    </div>
  );
};
