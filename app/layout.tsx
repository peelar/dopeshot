import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import {
  Inter,
  JetBrains_Mono,
  Space_Grotesk,
  DM_Sans,
  Syne,
  Archivo,
  Manrope,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

// Font definitions with CSS variables
const geistSans = GeistSans;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-professional",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-developer",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-bold",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-friendly",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-edgy",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-technical",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-premium",
});

// Combine all font variables
const fontVariables = [
  geistSans.variable, // --font-geist-sans (from package)
  inter.variable,
  jetbrainsMono.variable,
  spaceGrotesk.variable,
  dmSans.variable,
  syne.variable,
  archivo.variable,
  manrope.variable,
].join(" ");

export const metadata: Metadata = {
  title: "dopeshot",
  description: "Design cover art with manual layout configuration and Supabase",
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
            // Map geist variable to our naming convention
            "--font-clean": "var(--font-geist-sans)",
            // Use Inter as default sans-serif
            "--font-sans": "var(--font-professional)",
          } as React.CSSProperties
        }
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
