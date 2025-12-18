import type { Metadata } from "next";

const siteUrl = "https://dopeshot.vercel.app";
const previewImage = "/cover.png";

export const metadata: Metadata = {
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
  alternates: { canonical: `${siteUrl}/landing` },
  openGraph: {
    title: "dopeshot - Screenshot beautification for builders",
    description:
      "Your product is dope, your screenshots should be too. Drop a screenshot, pick a look, export. Built for makers who ship fast.",
    url: `${siteUrl}/landing`,
    type: "website",
    siteName: "dopeshot",
    images: [
      {
        url: previewImage,
        width: 2816,
        height: 1584,
        alt: "dopeshot - Screenshot beautification for builders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "dopeshot - Screenshot beautification for builders",
    description:
      "Your product is dope, your screenshots should be too. Drop a screenshot, get a shareable graphic in seconds.",
    images: [previewImage],
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
