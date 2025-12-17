"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef, useEffect } from "react";
import { configAtom } from "@/hooks/atoms";
import { Label } from "@/components/ui/label";
import { detectLanguage, extractFileName } from "@/domain/code/language-detection";
import { track } from "@/lib/analytics";

const LAYOUT_OPTIONS = [
  { value: "standard", label: "Standard", description: "Balanced padding and spacing" },
  { value: "wide", label: "Wide", description: "Optimized for long lines" },
  { value: "focus", label: "Focus", description: "More padding, calmer background" },
] as const;

const SIZE_OPTIONS = [
  { value: "social", label: "Social", description: "1200×630 (og:image)" },
  { value: "square", label: "Square", description: "1080×1080" },
  { value: "tall", label: "Tall", description: "1080×1920 (story)" },
] as const;

const EMPHASIS_OPTIONS = [
  { value: "auto", label: "Auto", description: "Intelligently emphasize key section" },
  { value: "none", label: "None", description: "No emphasis" },
  { value: "highlight", label: "Highlight", description: "Highlight specific lines" },
  { value: "dim", label: "Dim", description: "Dim non-essential lines" },
] as const;

export function CodeSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const previousContentRef = useRef<string>(config.code?.content || "");

  const handleCodeChange = useCallback(
    (value: string) => {
      const previousContent = previousContentRef.current;

      // Detect if this is a paste operation (substantial change in content length)
      const lengthDiff = Math.abs(value.length - previousContent.length);
      const isPaste = lengthDiff > 20; // Threshold for paste vs typing

      // Auto-detect language only on paste
      let newLanguage = config.code?.language || "javascript";
      let newFileName = config.code?.fileName;

      if (isPaste && value.trim().length > 10) {
        const detected = detectLanguage(value);
        if (detected !== 'text') {
          newLanguage = detected;
          track("code_language_detected", { language: detected });
        }

        // Try to extract filename
        const fileName = extractFileName(value);
        if (fileName) {
          newFileName = fileName;
          track("code_filename_detected", { fileName });
        }
      }

      previousContentRef.current = value;

      setConfig((currentConfig) => ({
        ...currentConfig,
        code: {
          ...currentConfig.code,
          content: value,
          language: newLanguage,
          theme: currentConfig.code?.theme || "github-dark",
          layout: currentConfig.code?.layout || "standard",
          size: currentConfig.code?.size || "social",
          emphasis: currentConfig.code?.emphasis || "auto",
          fileName: newFileName,
          highlightedLines: currentConfig.code?.highlightedLines || [],
          maxLines: currentConfig.code?.maxLines || 50,
        },
      }));
    },
    [setConfig, config.code?.language, config.code?.fileName],
  );

  const handleLayoutChange = useCallback(
    (layout: "standard" | "wide" | "focus") => {
      track("code_layout_changed", { layout });
      setConfig((currentConfig) => ({
        ...currentConfig,
        code: {
          ...currentConfig.code!,
          layout,
        },
      }));
    },
    [setConfig],
  );

  const handleSizeChange = useCallback(
    (size: "social" | "square" | "tall") => {
      track("code_size_changed", { size });
      setConfig((currentConfig) => ({
        ...currentConfig,
        code: {
          ...currentConfig.code!,
          size,
        },
      }));
    },
    [setConfig],
  );

  const handleEmphasisChange = useCallback(
    (emphasis: "auto" | "none" | "highlight" | "dim") => {
      track("code_emphasis_changed", { emphasis });
      setConfig((currentConfig) => ({
        ...currentConfig,
        code: {
          ...currentConfig.code!,
          emphasis,
        },
      }));
    },
    [setConfig],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Code Input */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="code-input" className="text-xs font-medium text-muted-foreground">
          Code
        </Label>
        <textarea
          id="code-input"
          value={config.code?.content || ""}
          onChange={(event) => handleCodeChange(event.target.value)}
          placeholder="// Paste your code here&#10;function hello() {&#10;  console.log('Hello, World!');&#10;}"
          rows={10}
          className="font-mono w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          style={{ fontFamily: "monospace" }}
        />
        {config.code?.language && config.code.language !== 'text' && (
          <p className="text-xs text-muted-foreground">
            Detected: {config.code.language}
            {config.code.fileName && ` • ${config.code.fileName}`}
          </p>
        )}
      </div>

      {/* Layout Selector */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="layout-select" className="text-xs font-medium text-muted-foreground">
          Layout
        </Label>
        <select
          id="layout-select"
          value={config.code?.layout || "standard"}
          onChange={(event) => handleLayoutChange(event.target.value as any)}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} title={option.description}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Size Selector */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="size-select" className="text-xs font-medium text-muted-foreground">
          Size
        </Label>
        <select
          id="size-select"
          value={config.code?.size || "social"}
          onChange={(event) => handleSizeChange(event.target.value as any)}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} title={option.description}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Emphasis Selector */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="emphasis-select" className="text-xs font-medium text-muted-foreground">
          Emphasis
        </Label>
        <select
          id="emphasis-select"
          value={config.code?.emphasis || "auto"}
          onChange={(event) => handleEmphasisChange(event.target.value as any)}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {EMPHASIS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} title={option.description}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
