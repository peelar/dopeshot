"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { track } from "@/lib/analytics";
import { Logo } from "./logo";
import type { SVGProps } from "react";

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const linkClassName =
    "text-sm text-neutral-400 hover:text-white transition-colors";

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Left: logo + short pitch + socials */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              onClick={() => track("landing_footer_link_clicked", { link: "home" })}
              className="inline-flex items-center transition-opacity hover:opacity-90"
              aria-label="dopeshot"
            >
              <Logo />
            </Link>

            <p className="mt-4 max-w-sm text-sm text-neutral-400">
              Turn screenshots into share-ready graphics in seconds. Built for indie hackers who ship fast and post
              often.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="https://twitter.com/gaba6ool"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("landing_footer_link_clicked", { link: "x" })}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 transition-all hover:bg-neutral-900 hover:text-white hover:-translate-y-0.5"
                aria-label="X (Twitter)"
              >
                <XIcon className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/peelar/dopeshot"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("landing_footer_link_clicked", { link: "github" })}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 transition-all hover:bg-neutral-900 hover:text-white hover:-translate-y-0.5"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="#examples"
                  onClick={() => track("landing_footer_link_clicked", { link: "features" })}
                  className={linkClassName}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="https://app.dopeshot.io"
                  onClick={() => track("landing_footer_link_clicked", { link: "pricing" })}
                  className={linkClassName}
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="https://github.com/peelar/dopeshot/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("landing_footer_link_clicked", { link: "docs" })}
                  className={linkClassName}
                >
                  Docs
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/peelar/dopeshot/blob/main/apps/app/CHANGELOG.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("landing_footer_link_clicked", { link: "changelog" })}
                  className={linkClassName}
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="https://peelar.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("landing_footer_link_clicked", { link: "about" })}
                  className={linkClassName}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/gaba6ool"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("landing_footer_link_clicked", { link: "twitter" })}
                  className={linkClassName}
                >
                  X / Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/peelar/dopeshot"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("landing_footer_link_clicked", { link: "github_company" })}
                  className={linkClassName}
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-800 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">© {currentYear} dopeshot. Ship fast, post faster.</p>
          <p className="text-sm text-neutral-500">
            Built by{" "}
            <a
              href="https://peelar.dev"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("landing_footer_link_clicked", { link: "builder" })}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Adrian Pilarczyk
            </a>
            {" "}
            · An indie project
          </p>
        </div>
      </div>
    </footer>
  );
}
