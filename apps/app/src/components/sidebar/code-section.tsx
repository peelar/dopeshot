"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { configAtom } from "@/hooks/atoms";
import { Label } from "@/components/ui/label";
import { detectLanguage } from "@/domain/code/language-detection";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
];

const THEME_OPTIONS = [
  { value: "github-dark", label: "GitHub Dark" },
  { value: "github-light", label: "GitHub Light" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "monokai", label: "Monokai" },
  { value: "one-dark-pro", label: "One Dark Pro" },
  { value: "material-theme", label: "Material Theme" },
  { value: "solarized-dark", label: "Solarized Dark" },
  { value: "solarized-light", label: "Solarized Light" },
];

export function CodeSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const previousContentRef = useRef<string>(config.code?.content || "");

  const handleCodeChange = useCallback(
    (value: string) => {
      const previousContent = previousContentRef.current;
      const currentLanguage = config.code?.language || "javascript";

      // Detect if this is a paste operation (substantial change in content length)
      const lengthDiff = Math.abs(value.length - previousContent.length);
      const isPaste = lengthDiff > 20; // Threshold for paste vs typing

      // Auto-detect language only on paste, and only if content is substantial
      let newLanguage = currentLanguage;
      if (isPaste && value.trim().length > 10) {
        const detected = detectLanguage(value);
        // Only override if we detected something other than 'text'
        if (detected !== 'text') {
          newLanguage = detected;
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
        },
      }));
    },
    [setConfig, config.code?.language],
  );

  const handleLanguageChange = useCallback(
    (language: string) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        code: {
          ...currentConfig.code,
          content: currentConfig.code?.content || "",
          language,
          theme: currentConfig.code?.theme || "github-dark",
        },
      }));
    },
    [setConfig],
  );

  const handleThemeChange = useCallback(
    (theme: string) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        code: {
          ...currentConfig.code,
          content: currentConfig.code?.content || "",
          language: currentConfig.code?.language || "javascript",
          theme,
        },
      }));
    },
    [setConfig],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="language-select" className="text-xs font-medium text-muted-foreground">
          Language
        </Label>
        <select
          id="language-select"
          value={config.code?.language || "javascript"}
          onChange={(event) => handleLanguageChange(event.target.value)}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="theme-select" className="text-xs font-medium text-muted-foreground">
          Theme
        </Label>
        <select
          id="theme-select"
          value={config.code?.theme || "github-dark"}
          onChange={(event) => handleThemeChange(event.target.value)}
          className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {THEME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
