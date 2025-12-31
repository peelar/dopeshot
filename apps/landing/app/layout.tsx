import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const landingSans = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
});

const simpleAnalyticsScriptUrl =
  process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_SCRIPT_URL ??
  "https://scripts.simpleanalyticscdn.com/latest.js";
const isSimpleAnalyticsEnabled =
  process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_ENABLED !== "false";
const shouldLoadAnalytics =
  isSimpleAnalyticsEnabled && process.env.NODE_ENV === "production";

const siteUrl = "https://dopeshot.io";
const previewImage = "/cover.png";
const twitterImage = "/og-preview.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "dopeshot - Screenshot beautification for builders",
  description:
    "Your product is dope, your screenshots should be too. Transform screenshots into shareable graphics in seconds. Free, no login required.",
  keywords: [
    "dopeshot",
    "screenshot beautification",
    "social media graphics",
    "twitter cards",
    "product launch",
    "indie hacker tools",
    "screenshot editor",
    "visual assets",
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "dopeshot - Screenshot beautification for builders",
    description:
      "Your product is dope, your screenshots should be too. Drop a screenshot, pick a look, export. Built for makers who ship fast.",
    url: siteUrl,
    type: "website",
    siteName: "dopeshot",
    images: [
      {
        url: twitterImage,
        width: 1200,
        height: 630,
        alt: "dopeshot - Screenshot beautification for builders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "dopeshot - Screenshot beautification for builders",
    description:
      "Your product is dope, your screenshots should be too. Drop a screenshot, get a shareable graphic in seconds.",
    images: [twitterImage],
  },
  icons: {
    icon: [{ url: "/dopeshot-icon.svg" }, { url: "/favicon.ico" }],
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${landingSans.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
        {shouldLoadAnalytics ? (
          <Script
            async
            defer
            src={simpleAnalyticsScriptUrl}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
