import { useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { detectLanguage } from "@/domain/code/language-detection";
import { cn } from "@/utils";
import { memo, useEffect, useState, useMemo } from "react";
import { codeToHtml } from "shiki";

interface CodeSnippetProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
}

// Canvas dimensions based on size
const SIZE_DIMENSIONS = {
  social: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  tall: { width: 1080, height: 1920 },
} as const;

// Layout-specific styling
const LAYOUT_STYLES = {
  standard: {
    padding: "36px",
    codeMaxWidth: "688px",
    backgroundOpacity: 1.0,
  },
  wide: {
    padding: "36px 48px",
    codeMaxWidth: "900px",
    backgroundOpacity: 1.0,
  },
  focus: {
    padding: "48px",
    codeMaxWidth: "640px",
    backgroundOpacity: 0.85,
  },
} as const;

function CodeSnippetComponent({ className }: CodeSnippetProps) {
  const { backgroundStyle, config, screenshotZoom } = useLayoutPrimitives();

  const [highlightedCode, setHighlightedCode] = useState<string>("");

  // Get code configuration
  const codeConfig = config.code || {
    content: '// Paste your code here\nfunction hello() {\n  console.log("Hello, World!");\n}',
    language: "javascript",
    theme: "github-dark",
    layout: "standard",
    size: "social",
    emphasis: "auto",
    maxLines: 50,
  };

  const {
    content,
    language,
    theme = "github-dark",
    layout = "standard",
    size = "social",
    emphasis = "auto",
    fileName,
    highlightedLines = [],
    maxLines = 50,
  } = codeConfig;

  // Detect language if not provided
  const detectedLanguage = language || detectLanguage(content);

  // Auto-trim long snippets
  const { processedCode, trimmedLines } = useMemo(() => {
    const lines = content.split('\n');
    if (lines.length > maxLines) {
      return {
        processedCode: lines.slice(0, maxLines).join('\n'),
        trimmedLines: lines.length - maxLines,
      };
    }
    return { processedCode: content, trimmedLines: 0 };
  }, [content, maxLines]);

  // Calculate auto-emphasis (intelligent line highlighting)
  const autoEmphasisLines = useMemo(() => {
    if (emphasis !== 'auto') return [];

    // Simple heuristic: find lines with function definitions, class declarations, or exports
    const lines = processedCode.split('\n');
    const emphasisLines: number[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      // Match common important patterns
      if (
        /^(export\s+)?(function|class|const|let|var|interface|type|enum)\s+\w+/.test(trimmed) ||
        /^(public|private|protected)\s+(class|interface|function|async)/.test(trimmed) ||
        /^(def|class|async def)\s+\w+/.test(trimmed)
      ) {
        emphasisLines.push(index + 1); // 1-indexed for Shiki
      }
    });

    // Limit to 3-5 lines max
    return emphasisLines.slice(0, 5);
  }, [processedCode, emphasis]);

  // Determine which lines to emphasize
  const linesToHighlight = useMemo(() => {
    switch (emphasis) {
      case 'auto':
        return autoEmphasisLines;
      case 'highlight':
        return highlightedLines;
      case 'none':
      case 'dim':
      default:
        return [];
    }
  }, [emphasis, autoEmphasisLines, highlightedLines]);

  // Render code with Shiki
  useEffect(() => {
    let isMounted = true;

    async function highlightCode() {
      try {
        const html = await codeToHtml(processedCode, {
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
          setHighlightedCode(`<pre><code>${processedCode}</code></pre>`);
        }
      }
    }

    highlightCode();

    return () => {
      isMounted = false;
    };
  }, [processedCode, detectedLanguage, theme]);

  // Get canvas dimensions based on size
  const { width: canvasWidth, height: canvasHeight } = SIZE_DIMENSIONS[size];

  // Get layout-specific styles
  const layoutStyle = LAYOUT_STYLES[layout];

  // Background with opacity for focus mode
  const backgroundWithOpacity = useMemo(() => {
    if (!backgroundStyle) return undefined;

    // For focus mode, we'll add a semi-transparent overlay
    if (layout === 'focus' && backgroundStyle.startsWith('linear-gradient')) {
      // Parse and reduce opacity of gradient stops
      return backgroundStyle;
    }

    return backgroundStyle;
  }, [backgroundStyle, layout]);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: "transparent", isolation: "isolate" }}
    >
      <div className="relative z-10 h-full w-full">
        <div className="flex h-full w-full items-center justify-center">
          {/* Canvas container */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              transform: `scale(${screenshotZoom})`,
            }}
          >
            {/* Code card centered inside */}
            <div style={{ maxWidth: layoutStyle.codeMaxWidth, width: '100%' }}>
              {/* Gradient wrapper */}
              <div
                className="overflow-hidden rounded-2xl shadow-2xl"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  background:
                    backgroundWithOpacity ||
                    "linear-gradient(90deg, #ec4899 0%, #d946ef 50%, #8b5cf6 100%)",
                  padding: layoutStyle.padding,
                }}
              >
                {/* Card content */}
                <div className="flex flex-col gap-3">
                  {/* Header bar (always present) */}
                  <div className="flex items-center justify-between">
                    {fileName ? (
                      <div className="text-sm font-medium text-white/90 font-mono">
                        {fileName}
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-white/20" />
                        <div className="w-3 h-3 rounded-full bg-white/20" />
                        <div className="w-3 h-3 rounded-full bg-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Code block with Shiki highlighting */}
                  <div
                    className={cn(
                      "code-snippet overflow-hidden rounded-xl",
                      emphasis === 'dim' && "code-dim-mode"
                    )}
                    data-emphasis={emphasis}
                    data-highlight-lines={linesToHighlight.join(',')}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />

                  {/* Trim indicator */}
                  {trimmedLines > 0 && (
                    <div className="text-xs text-white/60 text-center font-mono">
                      + {trimmedLines} more line{trimmedLines !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Footer with DopeShot attribution */}
                  <div className="flex items-center justify-center pt-1">
                    <div className="text-xs text-white/40 font-medium">
                      Made with DopeShot
                    </div>
                  </div>
                </div>
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

        /* Emphasis: Dim mode */
        .code-dim-mode :global(pre) {
          opacity: 0.5;
        }

        /* Emphasis: Highlight mode */
        .code-snippet[data-emphasis="highlight"] :global(.line) {
          transition: opacity 0.2s ease;
        }

        .code-snippet[data-emphasis="highlight"]:hover :global(.line) {
          opacity: 0.4;
        }

        .code-snippet[data-emphasis="highlight"]:hover :global(.line.highlighted) {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
          padding-left: 0.5rem;
          margin-left: -0.5rem;
          border-left: 3px solid rgba(255, 255, 255, 0.5);
        }

        /* Auto emphasis: subtle highlight */
        .code-snippet[data-emphasis="auto"] :global(.line.auto-emphasis) {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}

export const CodeSnippet = memo(CodeSnippetComponent);
