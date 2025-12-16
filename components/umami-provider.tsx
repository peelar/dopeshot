"use client";

import Script from "next/script";

/**
 * Umami Analytics Provider with privacy-first configuration
 *
 * Privacy Features:
 * - No cookies or localStorage by default
 * - No user profiling or identification
 * - GDPR-compliant by default
 * - Automatic page view tracking
 * - Custom event tracking via window.umami
 */
export function UmamiProvider({ children }: { children: React.ReactNode }) {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";

  if (!websiteId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Umami website ID not configured. Set NEXT_PUBLIC_UMAMI_WEBSITE_ID."
      );
    }
    return <>{children}</>;
  }

  return (
    <>
      <Script
        async
        src={scriptUrl}
        data-website-id={websiteId}
        strategy="afterInteractive"
        onLoad={() => {
          if (process.env.NODE_ENV === "development") {
            console.log("Umami Analytics loaded (privacy-first mode)");
          }
        }}
      />
      {children}
    </>
  );
}
