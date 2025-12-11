import { memo, useEffect, useState } from "react";
import { cn } from "@/utils";
import { LookSurface, useLookPrimitives } from "@/components/looks/shared/look-primitives";
import { codeToHtml } from "shiki";

/**
 * Detect programming language from code content using simple heuristics
 * Fallback: returns 'text' if no match found
 */
function detectLanguage(code: string): string {
  const trimmed = code.trim();

  // JavaScript/TypeScript patterns
  if (/^(import|export)\s/.test(trimmed) || /\b(const|let|var)\s+\w+\s*=/.test(trimmed)) {
    if (/:\s*(string|number|boolean|any|void)/.test(trimmed) || /interface\s+\w+/.test(trimmed)) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Python patterns
  if (/^(def|class|import|from)\s/.test(trimmed) || /^\s{0,4}(if|for|while)\s+.*:/.test(trimmed)) {
    return 'python';
  }

  // HTML patterns
  if (/^<!DOCTYPE html>|^<html|^<\w+[^>]*>/.test(trimmed)) {
    return 'html';
  }

  // CSS patterns
  if (/^[.#\w\s]+\{[\s\S]*\}/.test(trimmed) || /@media|@keyframes/.test(trimmed)) {
    return 'css';
  }

  // JSON patterns
  if (/^\{[\s\S]*\}$|^\[[\s\S]*\]$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Markdown patterns
  if (/^#{1,6}\s/.test(trimmed) || /\[.*\]\(.*\)/.test(trimmed)) {
    return 'markdown';
  }

  // Java patterns
  if (/\b(public|private|protected)\s+(class|interface|enum)/.test(trimmed)) {
    return 'java';
  }

  // Go patterns
  if (/^package\s+\w+|func\s+\w+\(/.test(trimmed)) {
    return 'go';
  }

  // Rust patterns
  if (/^(use\s+\w+|fn\s+\w+|pub\s+fn)/.test(trimmed) || /\blet\s+mut\s/.test(trimmed)) {
    return 'rust';
  }

  // SQL patterns
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return 'sql';
  }

  // Shell/Bash patterns
  if (/^#!\/bin\/(ba)?sh|^\$\s+/.test(trimmed) || /^(echo|cd|ls|mkdir)\s/.test(trimmed)) {
    return 'bash';
  }

  // Ruby patterns
  if (/^(require|class|module|def)\s/.test(trimmed) || /\bend\s*$/.test(trimmed)) {
    return 'ruby';
  }

  // PHP patterns
  if (/^<\?php/.test(trimmed)) {
    return 'php';
  }

  // C++ patterns
  if (/#include\s*<|using namespace|std::/.test(trimmed)) {
    return 'cpp';
  }

  // C# patterns
  if (/\b(namespace|using)\s+\w+;/.test(trimmed) || /\[[\w.]+\]/.test(trimmed)) {
    return 'csharp';
  }

  // YAML patterns
  if (/^\w+:\s*$|^\s{2,}\w+:/.test(trimmed)) {
    return 'yaml';
  }

  // Default fallback
  return 'text';
}

interface CodeSnippetProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function CodeSnippetComponent({ className }: CodeSnippetProps) {
  const {
    assets,
    assetMap,
    backgroundStyle,
    config,
  } = useLookPrimitives();

  const [highlightedCode, setHighlightedCode] = useState<string>("");

  // Get code from config
  const code = config.code?.content || '// Paste your code here\nfunction hello() {\n  console.log("Hello, World!");\n}';
  const configuredLanguage = config.code?.language;
  const detectedLanguage = configuredLanguage || detectLanguage(code);
  const theme = config.code?.theme || "github-dark";

  useEffect(() => {
    let isMounted = true;

    async function highlightCode() {
      try {
        const html = await codeToHtml(code, {
          lang: detectedLanguage,
          theme: theme,
        });

        if (isMounted) {
          setHighlightedCode(html);
        }
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain text
        if (isMounted) {
          setHighlightedCode(`<pre><code>${code}</code></pre>`);
        }
      }
    }

    highlightCode();

    return () => {
      isMounted = false;
    };
  }, [code, detectedLanguage, theme]);

  return (
    <LookSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
      screenshot={undefined}
    >
      <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-[640px]">
          <div
            className="overflow-hidden rounded-2xl shadow-2xl"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              className="code-snippet"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .code-snippet :global(pre) {
          margin: 0;
          padding: 1.5rem;
          font-size: 0.95rem;
          line-height: 1.6;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace;
        }

        .code-snippet :global(code) {
          font-family: inherit;
        }
      `}</style>
    </LookSurface>
  );
}

export const CodeSnippet = memo(CodeSnippetComponent);
