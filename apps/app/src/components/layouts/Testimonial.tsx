import { memo, useEffect, useMemo, useRef } from "react";
import { useAtomValue } from "jotai";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import { LogoBadge } from "@/components/layouts/shared/LogoBadge";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { ScanlinesOverlay } from "@/components/layouts/shared/ScanlinesOverlay";
import { DotsOverlay } from "@/components/layouts/shared/DotsOverlay";
import { orientationAtom, assetsAtom, brandSettingsAtom } from "@/hooks/atoms";
import { AdrianAvatar } from "@/components/ui/adrian-avatar";
import { useSession } from "@/lib/auth/auth-client";
import { useUserTier } from "@/hooks/use-user-tier";
import { resolveTestimonialStyle } from "@/domain/layout/testimonial-style";
import type { BrandMode } from "@/lib/types/brand";
import { track } from "@/lib/analytics";

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

function StarRating({ rating, color }: { rating: number; color: string }) {
  if (rating <= 0) return null;
  return (
    <div className="flex gap-1" style={{ color }}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} filled={i < rating} />
      ))}
    </div>
  );
}

function TestimonialComponent({ className, onUploadAsset, isStatic = false }: TestimonialProps) {
  const orientation = useAtomValue(orientationAtom);
  const allAssets = useAtomValue(assetsAtom);
  const brandSettings = useAtomValue(brandSettingsAtom);
  const { data: session } = useSession();
  const { isBrandUser } = useUserTier();
  const { resolvedTheme } = useTheme();
  const trackedBrandStyleRef = useRef<string | null>(null);
  const {
    assets,
    assetMap,
    backgroundStyle,
    config,
    logo,
    text,
  } = useLayoutPrimitives();

  const isMobile = orientation === "mobile";
  const fallbackMode: BrandMode = resolvedTheme === "dark" ? "dark" : "light";
  const isLoggedIn = Boolean(session?.user);

  const testimonialSettings = config.layoutSpecificSettings?.testimonial;
  const authorName = testimonialSettings?.authorName || "";
  const authorTitle = testimonialSettings?.authorTitle || "";
  const authorCompany = testimonialSettings?.authorCompany || "";
  const starRating = testimonialSettings?.starRating ?? 0;
  const styleAccentOverride = testimonialSettings?.styleAccent;
  const styleModeOverride = testimonialSettings?.styleMode;
  const shouldShowAvatar = testimonialSettings?.showAuthorAvatar !== false;
  const avatarAssetId = shouldShowAvatar ? testimonialSettings?.authorAvatarAssetId : undefined;

  const avatarAsset = useMemo(
    () => (avatarAssetId ? allAssets.find((a) => a.id === avatarAssetId) : undefined),
    [avatarAssetId, allAssets],
  );

  const attribution = useMemo(() => {
    const parts: string[] = [];
    if (authorTitle) parts.push(authorTitle);
    if (authorCompany) parts.push(authorCompany);
    return parts.join(", ");
  }, [authorTitle, authorCompany]);

  const testimonialStyle = useMemo(
    () =>
      resolveTestimonialStyle({
        isLoggedIn,
        isBrandUser,
        personality: brandSettings.personality,
        mode: styleModeOverride ?? brandSettings.mode,
        accent: styleAccentOverride ?? brandSettings.accent,
        fallbackMode,
        fallbackBackground: backgroundStyle,
      }),
    [
      backgroundStyle,
      brandSettings.mode,
      brandSettings.personality,
      fallbackMode,
      isBrandUser,
      isLoggedIn,
      styleAccentOverride,
      styleModeOverride,
      brandSettings.accent,
    ],
  );

  useEffect(() => {
    if (isStatic) return;

    if (testimonialStyle.tier !== "brand") {
      trackedBrandStyleRef.current = null;
      return;
    }

    const signature = `${testimonialStyle.personality}:${testimonialStyle.mode}`;
    if (trackedBrandStyleRef.current === signature) return;

    trackedBrandStyleRef.current = signature;
    track("testimonial_brand_style_applied", {
      personality: testimonialStyle.personality,
      mode: testimonialStyle.mode,
    });
  }, [isStatic, testimonialStyle.mode, testimonialStyle.personality, testimonialStyle.tier]);

  // Override font weight for testimonials - they should feel like paragraphs, not headlines
  // Also strip out font-family classes that would override inline styles
  const { testimonialClassName, testimonialFontWeight } = useMemo(() => {
    const titleClasses = text.titleClasses;

    // Map from title weight to paragraph weight (one weight down)
    let weight: string;
    if (titleClasses.includes("font-extrabold")) weight = "font-semibold";
    else if (titleClasses.includes("font-bold")) weight = "font-normal";
    else if (titleClasses.includes("font-medium")) weight = "font-light";
    else weight = "font-light";

    // Strip out font-weight and font-family classes that would conflict with inline styles
    const cleanedClasses = titleClasses
      .split(" ")
      .filter((cls) => !cls.startsWith("font-") || cls === weight)
      .join(" ");

    return {
      testimonialClassName: cn(cleanedClasses, "whitespace-pre-line", weight),
      testimonialFontWeight: weight,
    };
  }, [text.titleClasses]);

  const titleClassName = testimonialClassName;
  const quoteText = text.title;
  const quoteContent = text.titleContent;

  // Tighter line height for testimonials
  const testimonialLineHeight = useMemo(() => {
    const baseLineHeight = text.titleStyle.lineHeight as number;
    // Reduce line height slightly for testimonial feel (multiply by 0.9)
    return baseLineHeight * 0.9;
  }, [text.titleStyle.lineHeight]);

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
    if (!shouldShowAvatar) return null;
    if (avatarAsset) {
      return (
        <img
          src={avatarAsset.url}
          alt={authorName || "Author avatar"}
          className="rounded-full object-cover"
          style={{
            width: size,
            height: size,
            border: `2px solid ${testimonialStyle.avatarRingColor}`,
          }}
          crossOrigin="anonymous"
        />
      );
    }
    // Show AdrianAvatar as default placeholder
    const avatarSize = size >= 48 ? "md" : "sm";
    return (
      <div
        className="inline-flex shrink-0 rounded-full p-[2px]"
        style={{ background: testimonialStyle.avatarRingColor }}
      >
        <AdrianAvatar size={avatarSize} className="border-0" />
      </div>
    );
  };

  const hasAuthorMetadata = Boolean(authorName || attribution);

  const renderAuthorBlock = (align: "center" | "left" | "right" = "center") => {
    if (!authorName && !attribution) return null;
    const alignClass =
      align === "center" ? "text-center items-center" : align === "right" ? "text-right items-end" : "text-left items-start";

    return (
      <div className={cn("flex flex-col gap-1", alignClass)}>
        {authorName && (
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: text.fontFamily, color: testimonialStyle.textColor }}
          >
            {authorName}
          </span>
        )}
        {attribution && (
          <span
            className="text-xs"
            style={{ fontFamily: text.fontFamily, color: testimonialStyle.mutedTextColor }}
          >
            {attribution}
          </span>
        )}
      </div>
    );
  };

  return (
    <LayoutSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={testimonialStyle.canvasBackground}
      assets={assets}
      config={config}
      assetMap={assetMap}
      disablePatternOverlay
      highlightAccent={testimonialStyle.accent}
    >
      {testimonialStyle.texture === "grain" ? (
        <GrainOverlay enabled intensity={testimonialStyle.textureIntensity} />
      ) : null}
      {testimonialStyle.texture === "scanlines" ? (
        <ScanlinesOverlay enabled intensity={testimonialStyle.textureIntensity} />
      ) : null}
      {testimonialStyle.texture === "dots" ? (
        <DotsOverlay enabled intensity={testimonialStyle.textureIntensity} />
      ) : null}

      <div className="relative flex h-full w-full flex-col" data-export-element data-element="container">
        {/* Logo */}
        <div className="absolute left-14 top-8 z-10 flex items-center">
          {renderLogo()}
        </div>

        {testimonialStyle.showDecorativeBlobs ? (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-[14%] -top-[30%] z-[2] h-[52%] w-[42%] rounded-full blur-3xl"
              style={{ background: testimonialStyle.blobPrimary }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[28%] -right-[14%] z-[2] h-[48%] w-[40%] rounded-full blur-3xl"
              style={{ background: testimonialStyle.blobSecondary }}
            />
          </>
        ) : null}

        {/* Centered content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <div
            className={cn(
              "relative flex w-full max-w-3xl flex-col items-center gap-6 overflow-hidden border px-8 py-10 backdrop-blur-[2px]",
              isMobile && "gap-4 px-6 py-8",
            )}
            style={{
              background: testimonialStyle.cardBackground,
              borderColor: testimonialStyle.cardBorder,
              borderRadius: testimonialStyle.cardRadius,
              boxShadow: testimonialStyle.cardShadow,
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-5 top-3 text-7xl font-semibold leading-none"
              style={{
                color: testimonialStyle.quoteMarkColor,
                fontFamily: text.fontFamily,
                transform: "translateY(-8px)",
              }}
            >
              “
            </span>
            <StarRating rating={starRating} color={testimonialStyle.starColor} />
            {quoteText ? (
              <h1
                className={cn(titleClassName, "ds-testimonial-quote my-2 text-center")}
                style={{
                  ...text.titleStyle,
                  color: testimonialStyle.textColor,
                  lineHeight: testimonialLineHeight,
                }}
              >
                {quoteContent}
              </h1>
            ) : null}
            {shouldShowAvatar || hasAuthorMetadata ? (
              <div
                className="flex items-center gap-3 rounded-full border px-4 py-2"
                style={{
                  background: testimonialStyle.authorPlateBackground,
                  borderColor: testimonialStyle.authorPlateBorder,
                  boxShadow: testimonialStyle.authorPlateShadow,
                }}
              >
                {renderAvatar(48)}
                {renderAuthorBlock("left")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </LayoutSurface>
  );
}

export const Testimonial = memo(TestimonialComponent);
