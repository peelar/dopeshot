import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import {
  Inter,
  Commissioner,
  IBM_Plex_Mono,
  Bricolage_Grotesque,
  Rubik,
  Chivo,
  Chakra_Petch,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UmamiProvider } from "@/components/providers/umami-provider";
import { AuthProvider } from "@/lib/auth";

// Font definitions with CSS variables
const geistSans = GeistSans;

const interUi = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ui",
});

const commissioner = Commissioner({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-professional",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-developer",
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bold",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-friendly",
});

const chivo = Chivo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-edgy",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-technical",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-premium",
});

// Combine all font variables
const fontVariables = [
  geistSans.variable, // --font-geist-sans (from package)
  interUi.variable,
  commissioner.variable,
  ibmPlexMono.variable,
  bricolageGrotesque.variable,
  rubik.variable,
  chivo.variable,
  chakraPetch.variable,
  playfairDisplay.variable,
].join(" ");

const siteUrl = "https://app.dopeshot.io";
const previewImage = "/cover.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "dopeshot",
  description: "Your product is dope, your screenshots should be too",
  keywords: [
    "dopeshot",
    "social media screenshots",
    "marketing visuals",
    "twitter card generator",
    "product launch assets",
    "indie hacker tools",
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "dopeshot",
    description:
      "Your product is dope, your screenshots should be too. Transform product screenshots into Twitter-ready graphics in 10 seconds. Free, no login required.",
    url: siteUrl,
    type: "website",
    siteName: "dopeshot",
    images: [
      {
        url: previewImage,
        width: 2816,
        height: 1584,
        alt: "dopeshot cover graphic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "dopeshot",
    description:
      "Your product is dope, your screenshots should be too. Drop a screenshot, get a Twitter-ready graphic in 10 seconds.",
    images: [previewImage],
  },
  icons: {
    icon: [{ url: "/dopeshot-icon.svg" }, { url: "/favicon.ico" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontVariables} min-h-screen bg-background font-sans tracking-tight antialiased`}
        style={
          {
            "--font-clean": "var(--font-geist-sans)",
            "--font-sans": "var(--font-ui)",
          } as React.CSSProperties
        }
        suppressHydrationWarning
      >
        <AuthProvider>
          <UmamiProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              {children}
            </ThemeProvider>
          </UmamiProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
