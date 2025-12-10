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
    text,
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

  const titleClassName = cn("font-bold", text.fontSize.titleClass, text.textColorClass);
  const subtitleClassName = cn(
    "mt-2 min-h-[1.2rem]",
    text.fontSize.subtitleClass,
    text.textColorClass,
  );
  const title = text.title;
  const subtitle = text.subtitle;

  return (
    <LookSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
      screenshot={undefined}
    >
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-16 py-12">
        {/* Title and subtitle at the top */}
        {(title || subtitle) && (
          <div className="mb-8 w-full max-w-4xl text-center">
            {title ? (
              <h1
                className={cn(titleClassName, "text-balance leading-tight")}
                style={{ ...text.titleStyle, lineHeight: 1.05 }}
              >
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className={cn(subtitleClassName, "text-balance")} style={text.subtitleStyle}>
                {subtitle}
              </p>
            ) : null}
          </div>
        )}

        {/* Code block */}
        <div className="relative w-full max-w-4xl">
          <div
            className="overflow-hidden rounded-2xl shadow-2xl"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              className="code-snippet overflow-auto"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
              style={{
                maxHeight: "calc(100vh - 300px)",
              }}
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
