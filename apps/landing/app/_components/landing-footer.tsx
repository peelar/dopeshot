"use client";

import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";
import { track } from "@/lib/analytics";
import { Logo } from "./logo";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo + tagline */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              <span className="text-foreground font-medium">The polish your product deserves, in 10 seconds.</span>
              <br />
              <span className="text-[var(--accent-orange)] font-medium">Built for indie hackers who ship fast.</span>
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://dopeshot.io"
                  onClick={() => track("landing_footer_link_clicked", { link: "app" })}
                  className="text-sm text-muted-foreground hover:text-[var(--accent-orange)] transition-colors"
                >
                  Try dopeshot
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    track("landing_footer_link_clicked", { link: "waitlist_footer" });
                    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-sm text-muted-foreground hover:text-[var(--accent-orange)] transition-colors"
                >
                  Brand kits waitlist
                </button>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/dopeshot"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("landing_footer_link_clicked", { link: "github" })}
                className="text-muted-foreground hover:text-[var(--accent-orange)] transition-all hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com/dopeshot"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("landing_footer_link_clicked", { link: "twitter" })}
                className="text-muted-foreground hover:text-[var(--accent-orange)] transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:hello@dopeshot.io"
                onClick={() => track("landing_footer_link_clicked", { link: "contact" })}
                className="text-muted-foreground hover:text-[var(--accent-orange)] transition-all hover:scale-110"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} dopeshot. Ship fast, post faster.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-[var(--accent-orange)] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-[var(--accent-orange)] transition-colors"
            >
              Privacy
            </Link>
            <p className="text-xs text-muted-foreground">
              Made with ☕ for builders
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
