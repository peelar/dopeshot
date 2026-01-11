"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import { Mail, Check, AlertCircle, Loader2 } from "lucide-react";

type FormStatus = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    const emailDomain = email.split("@")[1];
    track("waitlist_form_submitted", { email_domain: emailDomain });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setEmail("");
        track("waitlist_signup_success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        track("waitlist_signup_error", { error: data.error });
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Failed to join waitlist. Please try again.");
      track("waitlist_signup_error", { error: "network_error" });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/5"
          >
            <div className="w-16 h-16 rounded-full bg-[var(--accent-orange)]/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-[var(--accent-orange)]" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">You&apos;re in!</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ll ping you when brand kits drop.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                onFocus={() => track("waitlist_form_focused")}
                placeholder="you@example.com"
                disabled={status === "loading"}
                className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-white/20 bg-white/10 text-foreground placeholder:text-muted-foreground focus:border-[var(--accent-orange)]/50 focus:outline-none focus:ring-4 focus:ring-[var(--accent-orange)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !email}
              className="w-full h-14 rounded-xl bg-[var(--accent-orange)] text-white font-semibold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[var(--accent-orange)]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <span>Get early access</span>
              )}
            </button>

            {status === "error" && errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </motion.div>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      {status !== "success" && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          No spam. Just a heads-up when it ships.
        </p>
      )}
    </div>
  );
}
