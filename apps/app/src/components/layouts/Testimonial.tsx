import { memo, useMemo } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils/cn";
import { LogoBadge } from "@/components/layouts/shared/LogoBadge";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { orientationAtom, assetsAtom } from "@/hooks/atoms";
import { buildShadowFromStyle } from "@/components/layouts/shared/shadows";

interface TestimonialProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  isStatic?: boolean;
}

function StarIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      className={filled ? "opacity-90" : "opacity-30"}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StarRating({ rating, textColorClass }: { rating: number; textColorClass: string }) {
  if (rating <= 0) return null;
  return (
    <div className={cn("flex gap-1", textColorClass)}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} filled={i < rating} />
      ))}
    </div>
  );
}

function TestimonialComponent({ className, onUploadAsset, isStatic = false }: TestimonialProps) {
  const orientation = useAtomValue(orientationAtom);
  const allAssets = useAtomValue(assetsAtom);
  const {
    assets,
    assetMap,
    backgroundStyle,
    config,
    logo,
    text,
    cornerRadius,
    personalityStyle,
  } = useLayoutPrimitives();

  const isMobile = orientation === "mobile";

  const testimonialSettings = config.layoutSpecificSettings?.testimonial;
  const authorName = testimonialSettings?.authorName || "";
  const authorTitle = testimonialSettings?.authorTitle || "";
  const authorCompany = testimonialSettings?.authorCompany || "";
  const starRating = testimonialSettings?.starRating ?? 0;
  const avatarAssetId = testimonialSettings?.authorAvatarAssetId;

  const avatarAsset = useMemo(
    () => (avatarAssetId ? allAssets.find((a) => a.id === avatarAssetId) : undefined),
    [avatarAssetId, allAssets],
  );

  const cardRadius = cornerRadius ?? 16;
  const cardShadow = useMemo(() => {
    if (personalityStyle) {
      return buildShadowFromStyle(personalityStyle.shadow);
    }
    return "0 4px 24px rgba(0, 0, 0, 0.12)";
  }, [personalityStyle]);

  const attribution = useMemo(() => {
    const parts: string[] = [];
    if (authorTitle) parts.push(authorTitle);
    if (authorCompany) parts.push(authorCompany);
    return parts.join(", ");
  }, [authorTitle, authorCompany]);

  const titleClassName = cn(text.titleClasses, "whitespace-pre-line", text.textColorClass);
  const quoteText = text.title;

  const renderLogo = () => {
    if (logo) {
      return (
        <img
          src={logo.url}
          alt="Logo"
          className="h-8 w-auto max-w-[200px] object-contain"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }
    if (!onUploadAsset || isStatic) return null;
    return (
      <LogoBadge
        logo={logo}
        label="Drop your logo here"
        replaceLabel="Replace logo"
        onUploadLogo={(file) => onUploadAsset(file, "logo")}
      />
    );
  };

  const renderAvatar = (size: number = 48) => {
    if (avatarAsset) {
      return (
        <img
          src={avatarAsset.url}
          alt={authorName || "Author avatar"}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
          crossOrigin="anonymous"
        />
      );
    }
    return null;
  };

  const renderAuthorBlock = (align: "center" | "left" | "right" = "center") => {
    if (!authorName && !attribution) return null;
    const alignClass =
      align === "center" ? "text-center items-center" : align === "right" ? "text-right items-end" : "text-left items-start";

    return (
      <div className={cn("flex flex-col gap-1", alignClass)}>
        {authorName && (
          <span
            className={cn("text-sm font-semibold", text.textColorClass)}
            style={{ fontFamily: text.fontFamily }}
          >
            {authorName}
          </span>
        )}
        {attribution && (
          <span
            className={cn("text-xs opacity-70", text.textColorClass)}
            style={{ fontFamily: text.fontFamily }}
          >
            {attribution}
          </span>
        )}
      </div>
    );
  };

  const variant = config.variant;

  if (variant === "card") {
    return (
      <LayoutSurface
        className={cn("bg-cover bg-center bg-no-repeat", className)}
        backgroundStyle={backgroundStyle}
        assets={assets}
        config={config}
        assetMap={assetMap}
      >
        <div className="relative z-10 flex h-full w-full flex-col" data-export-element data-element="container">
          {/* Logo */}
          <div className="absolute left-14 top-8 z-10 flex items-center">
            {renderLogo()}
          </div>

          {/* Card centered on canvas */}
          <div className="flex flex-1 items-center justify-center px-8 py-16">
            <div
              className="flex max-w-xl flex-col gap-6 bg-white/10 backdrop-blur-md"
              style={{
                borderRadius: `${cardRadius}px`,
                boxShadow: cardShadow !== "none" ? cardShadow : undefined,
                padding: isMobile ? "24px" : "40px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <StarRating rating={starRating} textColorClass={text.textColorClass} />
              {quoteText ? (
                <h1 className={titleClassName} style={text.titleStyle}>
                  {quoteText}
                </h1>
              ) : null}
              <div className="flex items-center gap-3">
                {renderAvatar(40)}
                {renderAuthorBlock("left")}
              </div>
            </div>
          </div>
        </div>
      </LayoutSurface>
    );
  }

  if (variant === "editorial") {
    return (
      <LayoutSurface
        className={cn("bg-cover bg-center bg-no-repeat", className)}
        backgroundStyle={backgroundStyle}
        assets={assets}
        config={config}
        assetMap={assetMap}
      >
        <div className="relative z-10 flex h-full w-full flex-col" data-export-element data-element="container">
          {/* Logo */}
          <div className="absolute right-14 top-8 z-10 flex items-center">
            {renderLogo()}
          </div>

          {/* Editorial layout - big quote mark + left-aligned quote + right-aligned attribution */}
          <div
            className={cn(
              "flex flex-1 flex-col justify-center",
              isMobile ? "px-8 py-16" : "px-14 py-16",
            )}
          >
            <div className="max-w-3xl space-y-8">
              {/* Decorative quote character */}
              <span
                className={cn("block leading-none opacity-20", text.textColorClass)}
                style={{
                  fontFamily: text.fontFamily,
                  fontSize: isMobile ? "80px" : "120px",
                  lineHeight: "0.8",
                }}
              >
                {"\u201C"}
              </span>

              {quoteText ? (
                <h1
                  className={cn(titleClassName, isMobile ? "-mt-4" : "-mt-8")}
                  style={text.titleStyle}
                >
                  {quoteText}
                </h1>
              ) : null}

              <div className="flex items-center justify-between">
                <StarRating rating={starRating} textColorClass={text.textColorClass} />
                <div className="flex items-center gap-3">
                  {renderAvatar(36)}
                  {renderAuthorBlock("right")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutSurface>
    );
  }

  // Default: centered variant
  return (
    <LayoutSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
    >
      <div className="relative z-10 flex h-full w-full flex-col" data-export-element data-element="container">
        {/* Logo */}
        <div className="absolute left-14 top-8 z-10 flex items-center">
          {renderLogo()}
        </div>

        {/* Centered content */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <div
            className={cn("flex max-w-2xl flex-col items-center gap-6", isMobile && "gap-4")}
          >
            <StarRating rating={starRating} textColorClass={text.textColorClass} />
            {quoteText ? (
              <h1 className={cn(titleClassName, "text-center")} style={text.titleStyle}>
                {quoteText}
              </h1>
            ) : null}
            <div className="flex items-center gap-3">
              {renderAvatar(48)}
              {renderAuthorBlock("center")}
            </div>
          </div>
        </div>
      </div>
    </LayoutSurface>
  );
}

export const Testimonial = memo(TestimonialComponent);
