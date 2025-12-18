import { useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { detectLanguage } from "@/domain/code/language-detection";
import { cn } from "@/utils";
import { memo, useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeSnippetProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

function CodeSnippetComponent({ className }: CodeSnippetProps) {
  const { backgroundStyle, config, screenshotZoom } = useLayoutPrimitives();

  const [highlightedCode, setHighlightedCode] = useState<string>("");

  // Get code from config
  const code =
    config.code?.content ||
    '// Paste your code here\nfunction hello() {\n  console.log("Hello, World!");\n}';
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

  const stagePadding = 0;
  const canvasWidth = 1280;
  const canvasHeight = 720;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: "transparent", isolation: "isolate" }}
    >
      <div className="relative z-10 h-full w-full" data-export-element data-element="container">
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ padding: `${stagePadding}px` }}
        >
          {/* Invisible canvas container - fixed 1280x720 */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              transform: `scale(${screenshotZoom})`,
            }}
          >
            {/* Code content centered inside, maintaining its natural size */}
            <div className="max-w-[688px]">
              {/* Gradient wrapper with 36px padding */}
              <div
                className="overflow-hidden rounded-2xl shadow-2xl"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  background:
                    backgroundStyle ||
                    "linear-gradient(90deg, #ec4899 0%, #d946ef 50%, #8b5cf6 100%)",
                  padding: "36px",
                }}
              >
                {/* Code snippet with Shiki background */}
                <div
                  className="code-snippet overflow-hidden rounded-xl"
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              </div>
            </div>
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
    </div>
  );
}

export const CodeSnippet = memo(CodeSnippetComponent);
