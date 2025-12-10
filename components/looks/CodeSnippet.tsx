import { memo, useEffect, useState } from "react";
import { cn } from "@/utils";
import { LookSurface, useLookPrimitives } from "@/components/looks/shared/look-primitives";
import { codeToHtml } from "shiki";

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
  const language = config.code?.language || "javascript";
  const theme = config.code?.theme || "github-dark";

  useEffect(() => {
    let isMounted = true;

    async function highlightCode() {
      try {
        const html = await codeToHtml(code, {
          lang: language,
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
  }, [code, language, theme]);

  return (
    <LookSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
      screenshot={undefined}
    >
      <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
        <div className="w-full max-w-4xl">
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
          padding: 2rem;
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
