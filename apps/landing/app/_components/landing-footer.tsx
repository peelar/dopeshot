"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { track } from "@/lib/analytics";
import { Logo } from "./logo";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Logo />
            <p className="text-sm text-muted-foreground">Built for builders</p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/dopeshot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("landing_footer_link_clicked", { link: "github" })}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="https://twitter.com/dopeshot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("landing_footer_link_clicked", { link: "twitter" })}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:hello@dopeshot.com"
              onClick={() => track("landing_footer_link_clicked", { link: "contact" })}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          © {currentYear} dopeshot. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
