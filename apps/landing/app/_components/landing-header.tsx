"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { Logo } from "./logo";

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        {/* CTA */}
        <Link
          href="https://app.dopeshot.io"
          onClick={() => track("landing_header_cta_clicked", { location: "header" })}
          className="group inline-flex h-10 items-center justify-center rounded-lg bg-[oklch(0.65_0.22_41.12_/_1)] px-6 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-[oklch(0.60_0.22_41.12_/_1)] active:scale-95"
        >
          Open the tool
        </Link>
      </div>
    </header>
  );
}
