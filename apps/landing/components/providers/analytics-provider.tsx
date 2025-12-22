"use client";

import Script from "next/script";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * Simple Analytics provider with a thin abstraction layer
 *
 * Features:
 * - Privacy-friendly tracking with no cookies or personal data
 * - Automatic page view tracking from Simple Analytics
 * - Custom event tracking through the shared analytics utility (window.sa_event)
 * - Easily swappable by keeping all provider logic in one place
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const scriptUrl =
    process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_SCRIPT_URL ??
    "https://scripts.simpleanalyticscdn.com/latest.js";

  const analyticsEnabled =
    process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_ENABLED !== "false";
  const shouldLoadAnalytics = analyticsEnabled && process.env.NODE_ENV === "production";

  if (!shouldLoadAnalytics) {
    return <>{children}</>;
  }

  return (
    <>
      <Script
        async
        defer
        src={scriptUrl}
        strategy="afterInteractive"
        onLoad={() => {
          if (process.env.NODE_ENV === "development") {
            console.log("Simple Analytics loaded (privacy-first mode)");
          }
        }}
      />
      {children}
    </>
  );
}
