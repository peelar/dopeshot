import { memo, useMemo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils/cn";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { LogoBadge } from "@/components/layouts/shared/LogoBadge";
import { assetsAtom, configAtom } from "@/hooks/atoms";
import { track } from "@/lib/analytics";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";

interface LogoSwapProps {
  className?: string;
  onUploadAsset?: (
    file: File,
    kind: "screenshot" | "logo" | "background" | "avatar",
  ) => void;
  isStatic?: boolean;
}

function LogoSwapComponent({
  className,
  onUploadAsset,
  isStatic = false,
}: LogoSwapProps) {
  const allAssets = useAtomValue(assetsAtom);
  const setAssets = useSetAtom(assetsAtom);
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);

  const { assets, assetMap, backgroundStyle } = useLayoutPrimitives();

  const logoSwapSettings = config.layoutSpecificSettings?.logoSwap;
  const leftLogoAssetId = logoSwapSettings?.leftLogoAssetId;
  const rightLogoAssetId = logoSwapSettings?.rightLogoAssetId;
  const separatorStyle = logoSwapSettings?.separatorStyle ?? "dash";

  const leftLogoAsset = useMemo(
    () =>
      leftLogoAssetId
        ? allAssets.find((a) => a.id === leftLogoAssetId)
        : undefined,
    [leftLogoAssetId, allAssets],
  );

  const rightLogoAsset = useMemo(
    () =>
      rightLogoAssetId
        ? allAssets.find((a) => a.id === rightLogoAssetId)
        : undefined,
    [rightLogoAssetId, allAssets],
  );

  const handleLogoUpload = useCallback(
    (file: File, position: "left" | "right") => {
      if (!onUploadAsset) return;
      onUploadAsset(file, "logo");

      // After upload completes and asset is added, assign it to the correct position
      setTimeout(() => {
        setAssets((currentAssets) => {
          const logoAssets = currentAssets.filter((a) => a.kind === "logo");
          const newLogo = logoAssets[logoAssets.length - 1];
          if (newLogo) {
            const field =
              position === "left" ? "leftLogoAssetId" : "rightLogoAssetId";
            setConfig((prev) => ({
              ...prev,
              layoutSpecificSettings: {
                ...prev.layoutSpecificSettings,
                logoSwap: {
                  ...prev.layoutSpecificSettings?.logoSwap,
                  [field]: newLogo.id,
                },
              },
            }));
          }
          return currentAssets;
        });
      }, 50);

      track("logo_swap_logo_uploaded", { position });
    },
    [onUploadAsset, setAssets, setConfig],
  );

  const renderSeparator = () => {
    if (separatorStyle === "none") return null;

    return (
      <div className="flex shrink-0 items-center justify-center">
        {separatorStyle === "dash" && (
          <div className="h-16 w-1 rotate-[20deg] rounded-full bg-white/30" />
        )}
        {separatorStyle === "x" && (
          <span className="select-none text-5xl font-normal text-white/35">
            &times;
          </span>
        )}
      </div>
    );
  };

  const renderLogo = (
    asset: typeof leftLogoAsset,
    position: "left" | "right",
  ) => {
    if (asset) {
      return (
        <img
          src={asset.url}
          alt={`${position === "left" ? "Left" : "Right"} logo`}
          className="max-h-full max-w-full object-contain brightness-0 invert"
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
        label={position === "left" ? "Left logo" : "Right logo"}
        replaceLabel="Replace"
        onUploadLogo={(file) => handleLogoUpload(file, position)}
        width={160}
        height={160}
        borderRadius={16}
      />
    );
  };

  // Generate custom gradient background with irregular blob
  const accentColor = tokenToCssColor(config.colors.accent);
  const customBackground = useMemo(() => {
    return {
      background: `
        radial-gradient(ellipse 900px 700px at 45% 48%, ${accentColor}80 0%, transparent 50%),
        radial-gradient(ellipse 700px 600px at 55% 52%, ${accentColor}60 0%, transparent 60%),
        radial-gradient(ellipse 1100px 800px at 50% 50%, ${accentColor}40 0%, transparent 50%),
        linear-gradient(135deg, #f5f0ea 0%, #ebe5dd 100%)
      `,
    };
  }, [accentColor]);

  return (
    <LayoutSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
    >
      {/* Custom gradient background with irregular blob */}
      <div
        className="absolute inset-0"
        style={customBackground}
      />

      <GrainOverlay
        enabled={config.background?.grainEnabled ?? false}
      />

      <div
        className="relative flex h-full w-full items-center justify-center"
        data-export-element
        data-element="container"
      >
        <div className="flex items-center gap-8">
          {/* Left logo */}
          <div className="flex h-64 w-64 items-center justify-center">
            {renderLogo(leftLogoAsset, "left")}
          </div>

          {renderSeparator()}

          {/* Right logo */}
          <div className="flex h-64 w-64 items-center justify-center">
            {renderLogo(rightLogoAsset, "right")}
          </div>
        </div>
      </div>
    </LayoutSurface>
  );
}

export const LogoSwap = memo(LogoSwapComponent);
