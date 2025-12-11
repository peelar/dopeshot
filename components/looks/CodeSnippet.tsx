import { memo, useEffect, useState } from "react";
import { cn } from "@/utils";
import { LookSurface, useLookPrimitives } from "@/components/looks/shared/look-primitives";
import { codeToHtml } from "shiki";
import { detectLanguage } from "@/domain/code/language-detection";

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
      {/* Outer padding: 24px (1.5rem) on all sides */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
        <div
          className="max-w-[688px]"
        >
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
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .code-snippet :global(code) {
          font-family: inherit;
          white-space: pre-wrap;
        }
      `}</style>
    </LookSurface>
  );
}

export const CodeSnippet = memo(CodeSnippetComponent);
