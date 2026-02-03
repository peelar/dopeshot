"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AdrianAvatar } from "@/components/ui/adrian-avatar";
import { X, Mail, Calendar, Check, Sparkles, MessageSquare } from "lucide-react";
import type { SVGProps } from "react";

function XTwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Inline SVG noise texture for visual depth */
function NoiseTexture() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.025] dark:opacity-[0.04]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  onFeedback: () => void;
  thumbnailUrl?: string;
}

// Smooth spring config
const spring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const;

// Gentler spring for thumbnail
const thumbnailSpring = {
  type: "spring",
  stiffness: 300,
  damping: 25,
} as const;

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};

// Special hero treatment for the thumbnail
const thumbnailVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotate: -6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: -2,
    transition: {
      ...thumbnailSpring,
      delay: 0.1,
    },
  },
};

// Delayed variants for footer section
const footerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...spring,
      delay: 0.3,
    },
  },
};

export function ExportSuccessModal({
  isOpen,
  onClose,
  onSignup,
  onFeedback,
  thumbnailUrl,
}: ExportSuccessModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop - enhanced blur */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md dark:bg-black/50"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>

            {/* Modal */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/40 bg-background shadow-2xl shadow-black/10 dark:border-border/30 dark:shadow-black/30"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Animated corner blobs - matching empty canvas style */}
                <span
                  aria-hidden="true"
                  className="animate-blob-1 pointer-events-none absolute -left-[15%] -top-[25%] h-[55%] w-[45%] rounded-full bg-linear-to-br from-violet-500/25 to-fuchsia-500/15 blur-2xl dark:from-violet-500/40 dark:to-fuchsia-500/25"
                />
                <span
                  aria-hidden="true"
                  className="animate-blob-2 pointer-events-none absolute -right-[15%] -top-[20%] h-[50%] w-[40%] rounded-full bg-linear-to-bl from-blue-500/20 to-cyan-500/12 blur-2xl dark:from-blue-500/35 dark:to-cyan-500/22"
                />
                <span
                  aria-hidden="true"
                  className="animate-blob-3 pointer-events-none absolute -bottom-[25%] -left-[10%] h-[50%] w-[40%] rounded-full bg-linear-to-tr from-emerald-500/20 to-teal-500/12 blur-2xl dark:from-emerald-500/35 dark:to-teal-500/22"
                />
                <span
                  aria-hidden="true"
                  className="animate-blob-4 pointer-events-none absolute -bottom-[20%] -right-[15%] h-[55%] w-[45%] rounded-full bg-linear-to-tl from-orange-500/20 to-amber-500/12 blur-2xl dark:from-orange-500/35 dark:to-amber-500/22"
                />

                {/* Noise texture overlay */}
                <NoiseTexture />

                {/* Close button */}
                <Dialog.Close
                  className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>

                <motion.div
                  className="relative flex flex-col p-6"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Hero section - thumbnail as the star */}
                  <div className="flex flex-col items-center text-center">
                    {/* Thumbnail with dramatic presentation */}
                    {thumbnailUrl && (
                      <motion.div
                        variants={thumbnailVariants}
                        className="mb-5 overflow-hidden rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12),0_4px_12px_rgb(0,0,0,0.08)] ring-1 ring-black/5 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4),0_0_20px_rgb(251,146,60,0.1)] dark:ring-white/10"
                      >
                        <img
                          src={thumbnailUrl}
                          alt="Your creation"
                          className="h-auto w-[140px] object-contain"
                        />
                      </motion.div>
                    )}

                    {/* Success message */}
                    <motion.div variants={itemVariants}>
                      <Dialog.Title className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Nice one! Your shot is ready
                      </Dialog.Title>
                      <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
                        Go ship it. The world needs to see what you're building.
                      </Dialog.Description>
                    </motion.div>
                  </div>

                  {/* CTA section */}
                  <motion.div variants={itemVariants} className="mt-6 text-center">
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      Save your designs and pick up where you left off.
                    </p>
                    <Button onClick={onSignup} size="default" className="mt-3">
                      Create free account
                    </Button>
                  </motion.div>

                  {/* Founder section - warmer, separated */}
                  <motion.div
                    variants={footerVariants}
                    className="-mx-6 -mb-6 mt-6 rounded-b-2xl bg-muted/40 px-6 py-4 dark:bg-muted/20"
                  >
                    <div className="flex gap-3">
                      <AdrianAvatar size="md" className="shrink-0 ring-2 ring-background" />
                      <div className="flex-1">
                        <p className="text-[13px] leading-relaxed text-muted-foreground">
                          I'm Adrian — building dopeshot for builders like you. Got ideas or
                          feedback? Let's chat.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={onFeedback}
                            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:bg-background hover:text-foreground  dark:border-border/40 dark:bg-background/50 dark:hover:bg-background"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Feedback
                          </button>
                          <CopyEmailButton email="adrian@peelar.dev" />
                          <ContactLink
                            href="https://cal.com/adrian-pilarczyk-cs0y69/30min"
                            icon={<Calendar className="h-3.5 w-3.5" />}
                            label="Chat"
                          />
                          <ContactLink
                            href="https://twitter.com/gaba6ool"
                            icon={<XTwitterIcon className="h-3.5 w-3.5" />}
                            label="X"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function ContactLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:bg-background hover:text-foreground  dark:border-border/40 dark:bg-background/50 dark:hover:bg-background"
    >
      {icon}
      {label}
    </a>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:bg-background hover:text-foreground  dark:border-border/40 dark:bg-background/50 dark:hover:bg-background"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
      Email
    </button>
  );
}
