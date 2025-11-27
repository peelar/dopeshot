import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, ElementType, KeyboardEvent } from "react";
import { LayoutConfig, ShadowIntensity } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";
import { getGradientById } from "@/domain/layout/gradients";
import { customGradientToCss } from "@/domain/layout/gradient-utils";
import { getFontCssValue, getFontSizeById } from "@/domain/layout/fonts";

const SHADOW_PRESETS: Record<ShadowIntensity, string> = {
  low: "0 2px 8px rgba(0, 0, 0, 0.08)",
  medium: "0 4px 16px rgba(0, 0, 0, 0.15)",
  high: "0 12px 40px rgba(0, 0, 0, 0.3)",
};

interface PopupGradientProps {
  config: LayoutConfig;
  assets?: Asset[];
  className?: string;
  onTextChange?: (field: "title" | "subtitle", value: string) => void;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
}

// Pre-computed color token maps (module-level to avoid recreation)
const COLOR_MAP: Record<string, string> = {
  "slate-50": "rgb(248 250 252)",
  "slate-100": "rgb(241 245 249)",
  "slate-200": "rgb(226 232 240)",
  "slate-300": "rgb(203 213 225)",
  "slate-500": "rgb(100 116 139)",
  "slate-600": "rgb(71 85 105)",
  "slate-800": "rgb(30 41 59)",
  "slate-900": "rgb(15 23 42)",
  "zinc-50": "rgb(250 250 250)",
  "zinc-200": "rgb(228 228 231)",
  "zinc-900": "rgb(24 24 27)",
  "indigo-50": "rgb(238 242 255)",
  "indigo-400": "rgb(129 140 248)",
  "indigo-950": "rgb(23 37 84)",
  "violet-400": "rgb(167 139 250)",
  "violet-500": "rgb(139 92 246)",
};

const TEXT_CLASS_MAP: Record<string, string> = {
  "slate-50": "text-slate-50",
  "slate-100": "text-slate-100",
  "slate-200": "text-slate-200",
  "slate-300": "text-slate-300",
  "slate-500": "text-slate-500",
  "slate-600": "text-slate-600",
  "slate-800": "text-slate-800",
  "slate-900": "text-slate-900",
  "zinc-50": "text-zinc-50",
  "zinc-200": "text-zinc-200",
  "zinc-900": "text-zinc-900",
  "indigo-50": "text-indigo-50",
  "indigo-400": "text-indigo-400",
  "indigo-950": "text-indigo-950",
  "violet-400": "text-violet-400",
  "violet-500": "text-violet-500",
};

// Map color tokens to CSS color values
function tokenToCssColor(token: string): string {
  return COLOR_MAP[token] || "rgb(248 250 252)";
}

// Map color tokens to Tailwind text color classes
function tokenToTextColorClass(token: string): string {
  return TEXT_CLASS_MAP[token] || "text-slate-900";
}

const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_MAX_SIZE = 10 * 1024 * 1024;

function LogoDropTarget({ onUploadLogo }: { onUploadLogo?: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File) => {
    if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
      setError("Use PNG, JPG, or WebP.");
      return false;
    }
    if (file.size > LOGO_MAX_SIZE) {
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
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!onUploadLogo) return;
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile, onUploadLogo],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
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
    (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  return (
    <div className="space-y-1">
      <div
        role="button"
        tabIndex={onUploadLogo ? 0 : -1}
        aria-label="Upload logo. Drag and drop or press Enter to browse files"
        aria-disabled={!onUploadLogo}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center justify-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          "border-white/50 bg-white/15 text-white/80 backdrop-blur-md",
          onUploadLogo
            ? "cursor-pointer hover:border-white/80 hover:bg-white/25 hover:text-white"
            : "cursor-not-allowed opacity-70",
          isDragging && onUploadLogo ? "border-white/60 bg-white/10 text-white" : "",
        )}
      >
        Drop your logo here
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={LOGO_ALLOWED_TYPES.join(",")}
          onChange={(e) => handleFile(e.target.files?.[0])}
          tabIndex={-1}
          aria-hidden="true"
          disabled={!onUploadLogo}
        />
      </div>
      {error ? <p className="text-[10px] text-white/80">{error}</p> : null}
    </div>
  );
}

function PopupGradientComponent({
  config,
  assets = [],
  className,
  onTextChange,
  onUploadAsset,
}: PopupGradientProps) {
  // Memoize asset map to avoid recreation on every render
  const { screenshot, logo, assetMap } = useMemo(() => {
    const map = new Map(assets.map((a) => [a.id, a]));
    return {
      assetMap: map,
      screenshot: config.assets.screenshot ? map.get(config.assets.screenshot) : null,
      logo: config.assets.logo ? map.get(config.assets.logo) : null,
    };
  }, [assets, config.assets.screenshot, config.assets.logo]);

  // Memoize background style computation
  const backgroundStyle = useMemo((): string => {
    if (config.background?.type === "gradient") {
      if (config.background.customGradient) {
        return customGradientToCss(config.background.customGradient);
      }
      const gradient = getGradientById(config.background.value);
      if (gradient) return gradient.value;
    } else if (config.background?.type === "image") {
      const bgAsset = assetMap.get(config.background.value);
      if (bgAsset) return `url(${bgAsset.url})`;
    } else if (config.background?.type === "solid") {
      return tokenToCssColor(config.background.value);
    }
    // Fallback to old color logic if no background set (or invalid)
    const bgColor1 = tokenToCssColor(config.colors.background);
    const bgColor2 = tokenToCssColor(config.colors.accent);
    return `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`;
  }, [config.background, config.colors.background, config.colors.accent, assetMap]);

  // Variant determines image position: "left", "right", or "center"
  const imagePosition = config.variant || "right";
  const shadowStyle = SHADOW_PRESETS[config.screenshotShadow || "medium"];
  const fontStyle = { fontFamily: getFontCssValue(config.fontId) };
  const fontSize = getFontSizeById(config.fontSize);
  const titleStyle = { ...fontStyle, fontSize: `${fontSize.titleRem}rem` };
  const subtitleStyle = { ...fontStyle, fontSize: `${fontSize.subtitleRem}rem` };
  const textColorClass = tokenToTextColorClass(config.colors.text);
  const titleClassName = cn("font-bold", fontSize.titleClass, textColorClass);
  const subtitleClassName = cn("mt-4 min-h-[1.2rem]", fontSize.subtitleClass, textColorClass);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-cover bg-center bg-no-repeat",
        className,
      )}
      style={{
        aspectRatio: "1280 / 720",
        background: backgroundStyle,
      }}
    >
      {/* Logo */}
      {logo && (
        <div className="absolute left-8 top-8 z-10">
          <img
            src={logo.url}
            alt="Logo"
            className="h-8 w-auto object-contain"
            crossOrigin="anonymous"
          />
        </div>
      )}
      {!logo && (
        <div className="absolute left-8 top-8 z-10">
          <LogoDropTarget onUploadLogo={onUploadAsset ? (file) => onUploadAsset(file, "logo") : undefined} />
        </div>
      )}

      {/* Content based on image position */}
      {imagePosition === "right" && (
        <>
          {/* Text on left */}
          <div className="absolute left-8 top-[30%] z-10 max-w-lg">
            <InlineEditableText
              element="h1"
              field="title"
              value={config.text.title}
              placeholder="Change me"
              className={titleClassName}
              style={titleStyle}
              ariaLabel="Edit title"
              onTextChange={onTextChange}
            />
            {(config.text.subtitle || onTextChange) && (
              <InlineEditableText
                element="p"
                field="subtitle"
                value={config.text.subtitle}
                placeholder="Drop some flavor"
                className={subtitleClassName}
                style={subtitleStyle}
                ariaLabel="Edit subtitle"
                onTextChange={onTextChange}
              />
            )}
          </div>

          {/* Screenshot on right, popping up from bottom */}
          {screenshot && (
            <div
              className="z-5 absolute bottom-0 right-0 overflow-hidden"
              style={{
                width: "60%",
                height: "70%",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "0px",
                boxShadow: shadowStyle,
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </>
      )}

      {imagePosition === "left" && (
        <>
          {/* Screenshot on left */}
          {screenshot && (
            <div
              className="z-5 absolute bottom-0 left-0 overflow-hidden"
              style={{
                width: "60%",
                height: "70%",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "8px",
                boxShadow: shadowStyle,
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Text on right */}
          <div className="absolute right-8 top-[30%] z-10 max-w-lg text-right">
            <InlineEditableText
              element="h1"
              field="title"
              value={config.text.title}
              placeholder="Change me"
              className={cn(titleClassName, "text-right")}
              style={titleStyle}
              ariaLabel="Edit title"
              onTextChange={onTextChange}
            />
            {(config.text.subtitle || onTextChange) && (
              <InlineEditableText
                element="p"
                field="subtitle"
                value={config.text.subtitle}
                placeholder="Drop some flavor"
                className={cn(subtitleClassName, "text-right")}
                style={subtitleStyle}
                ariaLabel="Edit subtitle"
                onTextChange={onTextChange}
              />
            )}
          </div>
        </>
      )}

      {imagePosition === "center" && (
        <>
          {/* Text on top */}
          <div className="absolute left-1/2 top-[12%] z-10 w-full max-w-2xl -translate-x-1/2 px-8 text-center">
            <InlineEditableText
              element="h1"
              field="title"
              value={config.text.title}
              placeholder="Change me"
              className={titleClassName}
              style={titleStyle}
              ariaLabel="Edit title"
              onTextChange={onTextChange}
            />
            {(config.text.subtitle || onTextChange) && (
              <InlineEditableText
                element="p"
                field="subtitle"
                value={config.text.subtitle}
                placeholder="Drop some flavor"
                className={subtitleClassName}
                style={subtitleStyle}
                ariaLabel="Edit subtitle"
                onTextChange={onTextChange}
              />
            )}
          </div>

          {/* Screenshot centered, popping up from bottom */}
          {screenshot && (
            <div
              className="z-5 absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden"
              style={{
                width: "60%",
                height: "60%",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                boxShadow: shadowStyle,
              }}
            >
              <img
                src={screenshot.url}
                alt="Screenshot"
                className="object-cover"
                style={{
                  width: "111.11%", // 10% extends behind right border (100% / 0.9)
                  height: "166.67%", // 40% extends below bottom border (100% / 0.6)
                  objectPosition: "top left",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

type TextField = "title" | "subtitle";

interface InlineEditableTextProps {
  element: ElementType;
  field: TextField;
  value?: string;
  placeholder: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  onTextChange?: (field: TextField, value: string) => void;
}

function InlineEditableText({
  element,
  field,
  value,
  placeholder,
  className,
  style,
  ariaLabel,
  onTextChange,
}: InlineEditableTextProps) {
  const normalizedValue = value ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(normalizedValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditable = Boolean(onTextChange);
  const Tag = element;

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (!isEditable) return;
    setIsEditing(true);
  }, [isEditable]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setDraft(normalizedValue);
  }, [normalizedValue]);

  const handleCommit = useCallback(() => {
    setIsEditing(false);
    if (!onTextChange) {
      return;
    }
    if (draft !== normalizedValue) {
      onTextChange(field, draft);
    }
  }, [draft, field, normalizedValue, onTextChange]);

  const handleBlur = useCallback(() => {
    if (!isEditing) return;
    handleCommit();
  }, [handleCommit, isEditing]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isEditable) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        handleCommit();
      }
    },
    [cancelEditing, handleCommit, isEditable],
  );

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  }, []);

  const startKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        startEditing();
      }
    },
    [startEditing],
  );

  if (!isEditable) {
    return (
      <Tag className={className} style={style}>
        {normalizedValue}
      </Tag>
    );
  }

  const displayClassName = cn(
    className,
    "cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={handleDraftChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          className,
          "border-0 bg-transparent p-0 text-inherit outline-none placeholder:text-muted-foreground focus-visible:outline-none",
        )}
        style={style}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <Tag
      className={displayClassName}
      style={style}
      onClick={startEditing}
      onKeyDown={startKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ? `${ariaLabel} (press Enter to edit)` : undefined}
    >
      {normalizedValue}
    </Tag>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const PopupGradient = memo(PopupGradientComponent);
