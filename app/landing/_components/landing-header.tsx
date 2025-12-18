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
        <Link href="/landing" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        {/* CTA */}
        <Link
          href="/"
          onClick={() => track("landing_header_cta_clicked", { location: "header" })}
          className="group inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: "oklch(0.65 0.22 41.12 / 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "oklch(0.60 0.22 41.12 / 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "oklch(0.65 0.22 41.12 / 1)";
          }}
        >
          Open the tool
        </Link>
      </div>
    </header>
  );
}
