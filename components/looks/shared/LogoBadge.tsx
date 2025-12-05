import { useCallback, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { cn } from "@/utils";
import { Asset } from "@/domain/asset/types";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface LogoBadgeProps {
  logo?: Asset | null;
  onUploadLogo?: (file: File) => void;
  mutedBg?: string;
  label?: string;
  replaceLabel?: string;
  className?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export function LogoBadge({
  logo,
  onUploadLogo,
  mutedBg,
  label = "Drop your logo",
  replaceLabel = "Replace logo",
  className,
  width = 200,
  height = 60,
  borderRadius = 14,
}: LogoBadgeProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Use PNG, JPG, WebP, or SVG.");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Max size is 10MB.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleFile = useCallback(
    (file?: File) => {
      if (!file || !onUploadLogo) return;
      if (!validateFile(file)) return;
      onUploadLogo(file);
    },
    [onUploadLogo, validateFile],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!onUploadLogo) return;
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile, onUploadLogo],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!onUploadLogo) return;
      event.preventDefault();
      setIsDragging(true);
    },
    [onUploadLogo],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onUploadLogo) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inputRef.current?.click();
      }
    },
    [onUploadLogo],
  );

  const handleClick = useCallback(() => {
    if (!onUploadLogo) return;
    inputRef.current?.click();
  }, [onUploadLogo]);

  const idleTint = mutedBg ?? "rgba(255,255,255,0.05)";
  const hoverTint = "rgba(255,255,255,0.12)";
  const dragTint = "rgba(255,255,255,0.18)";
  const activeTint = isDragging ? dragTint : isHovered ? hoverTint : idleTint;

  return (
    <div className="space-y-1 text-left">
      <div
        role={onUploadLogo ? "button" : undefined}
        tabIndex={onUploadLogo ? 0 : -1}
        aria-label={
          onUploadLogo
            ? `${logo ? "Replace" : "Upload"} logo. Drag and drop or press Enter to browse files`
            : "Logo placeholder"
        }
        aria-disabled={!onUploadLogo}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative isolate inline-flex items-center justify-center overflow-hidden border border-dashed border-white/20 text-[11px] font-medium uppercase tracking-[0.16em] transition-all duration-200",
          "bg-transparent backdrop-blur-[1px]",
          onUploadLogo ? "cursor-pointer" : "cursor-default opacity-70",
          isDragging && onUploadLogo && "border-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_12px_28px_-12px_rgba(0,0,0,0.45)]",
          className,
        )}
        style={{
          width,
          height,
          borderRadius,
        }}
        data-dragging={isDragging}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80 transition-colors duration-200 group-hover:opacity-100"
          style={{
            background: activeTint,
            isolation: "isolate",
            borderRadius,
          }}
          data-dragging={isDragging}
        />
        <div
          className="pointer-events-none absolute inset-0 border border-dashed border-white/20 transition-colors duration-200 group-hover:border-white/60"
          style={{ borderRadius }}
          data-dragging={isDragging}
        />

        <div className="relative z-10 flex flex-col items-center justify-center gap-1 px-3 text-center text-white/80">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.18em] transition-opacity",
              "opacity-40 group-hover:opacity-80",
              isDragging && "opacity-100 text-white",
            )}
          >
            {logo ? replaceLabel : label}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={(e) => handleFile(e.target.files?.[0])}
          tabIndex={-1}
          aria-hidden="true"
          disabled={!onUploadLogo}
        />
      </div>
      {error ? <p className="text-[11px] text-white/90 mix-blend-difference">{error}</p> : null}
    </div>
  );
}
