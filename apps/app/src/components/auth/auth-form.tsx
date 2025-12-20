"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, signInWithEmail, signUpWithEmail, signOutUser, sendMagicLink } from "@/lib/auth";
import { track } from "@/lib/analytics";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm() {
  const { user, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [useMagicLink, setUseMagicLink] = useState(true); // Default to magic link
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const handleFormChange =
    (field: "email" | "password" | "confirmPassword") => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const resetForm = () =>
    setForm({
      email: "",
      password: "",
      confirmPassword: "",
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail || !form.password) {
      setStatus({ type: "error", message: "Email and password are required." });
      return;
    }

    if (mode === "sign-up" && form.password !== form.confirmPassword) {
      setStatus({ type: "error", message: "Passwords must match." });
      return;
    }

    track("auth_attempt", { method: "password", mode });

    const handler =
      mode === "sign-in"
        ? () => signInWithEmail(trimmedEmail, form.password)
        : () => signUpWithEmail(trimmedEmail, form.password);

    const { error } = await handler();
    if (error) {
      setStatus({ type: "error", message: error.message });
      track("auth_failed", { method: "password", mode, error: error.message });
      return;
    }

    track("auth_success", { method: "password", mode });
    setStatus({
      type: "success",
      message: mode === "sign-in" ? "Signed in successfully." : "Account created successfully.",
    });

    if (mode === "sign-in") {
      setForm((prev) => ({ ...prev, password: "" }));
    } else {
      resetForm();
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      setStatus({ type: "error", message: "Email is required." });
      return;
    }

    track("auth_attempt", { method: "magic_link" });

    const { error } = await sendMagicLink(trimmedEmail);
    if (error) {
      setStatus({ type: "error", message: error.message });
      track("auth_failed", { method: "magic_link", error: error.message });
      return;
    }

    track("auth_magic_link_sent");
    setSentEmail(trimmedEmail);
    setMagicLinkSent(true);
  };

  const handleSignOut = async () => {
    setStatus(null);
    const { error } = await signOutUser();
    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }
    track("auth_sign_out");
    setStatus({ type: "success", message: "Signed out successfully." });
  };

  const toggleAuthMethod = () => {
    setUseMagicLink(!useMagicLink);
    setStatus(null);
    setMagicLinkSent(false);
    track("auth_method_toggled", { to: !useMagicLink ? "magic_link" : "password" });
  };

  if (user) {
    return (
      <div className="mx-auto w-full max-w-md space-y-8 px-4">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-sm bg-background text-foreground"
              aria-hidden="true"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="2" y="2" width="20" height="20" rx="4" transform="rotate(45 12 12)" />
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-3 text-center">
          <h1 className="font-bold text-3xl tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">You&apos;re signed in as {user.email}</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-border/30 bg-white/40 p-4 shadow-xl backdrop-blur-xl dark:bg-background/60 sm:p-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isLoading}
            className="h-12 w-full rounded-lg border-border/50 bg-muted/40 text-foreground hover:bg-muted/60 hover:text-foreground"
          >
            Sign out
          </Button>
          {status && (
            <div
              className={`rounded-lg p-3 text-sm ${
                status.type === "error"
                  ? "border border-red-500/20 bg-red-500/10 text-red-400"
                  : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  const getHeading = () => {
    if (useMagicLink && magicLinkSent) return "Check your email";
    if (useMagicLink) return "Sign in to dopeshot";
    return mode === "sign-in" ? "Sign in to dopeshot" : "Create a dopeshot account";
  };

  const getSubheading = () => {
    if (useMagicLink && magicLinkSent) return `We sent a magic link to ${sentEmail}`;
    if (useMagicLink) return "We'll send you a magic link to sign in or create an account";
    if (mode === "sign-in") return "Enter your email and password";
    return "Enter your email and password to get started";
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8 px-4">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-background text-foreground"
            aria-hidden="true"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="2" width="20" height="20" rx="4" transform="rotate(45 12 12)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="space-y-3 text-center">
        <h1 className="font-bold text-3xl tracking-tight text-foreground">{getHeading()}</h1>
        <p className="text-sm text-muted-foreground">{getSubheading()}</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-border/30 bg-white/40 p-6 shadow-xl backdrop-blur-xl dark:bg-background/60">
        {magicLinkSent ? (
          <div className="space-y-5">
            <p className="text-center text-sm text-muted-foreground">
              Click the link in the email to sign in. The link will expire in 15 minutes.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMagicLinkSent(false);
                setForm({ email: "", password: "", confirmPassword: "" });
              }}
              className="h-12 w-full rounded-lg border-border/50 bg-muted/40 text-foreground hover:bg-muted/60 hover:text-foreground"
            >
              Send another link
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={useMagicLink ? handleMagicLink : handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="auth-email" className="text-sm text-foreground">
                Email
              </Label>
              <Input
                id="auth-email"
                type="email"
                value={form.email}
                onChange={handleFormChange("email")}
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-lg border-border/70 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:border-border focus:bg-muted/50"
              />
            </div>

            {!useMagicLink && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="auth-password" className="text-sm text-foreground">
                    Password
                  </Label>
                  <Input
                    id="auth-password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange("password")}
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    placeholder="Min. 8 characters"
                    className="h-12 rounded-lg border-border/70 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:border-border focus:bg-muted/50"
                  />
                </div>

                {mode === "sign-up" && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-password-confirm" className="text-sm text-foreground">
                      Confirm password
                    </Label>
                    <Input
                      id="auth-password-confirm"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleFormChange("confirmPassword")}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      className="h-12 rounded-lg border-border/70 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:border-border focus:bg-muted/50"
                    />
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90"
              disabled={isLoading}
            >
              {useMagicLink ? "Send magic link" : mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>

            {!useMagicLink && status && (
              <div
                className={`rounded-lg p-3 text-sm transition-all ${
                  status.type === "error"
                    ? "border border-red-500/20 bg-red-500/10 text-red-400"
                    : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {status.message}
              </div>
            )}

            {useMagicLink && status?.type === "error" && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {status.message}
              </div>
            )}
          </form>
        )}

        {!magicLinkSent && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="rounded-full border border-border/50 bg-background px-2 py-0.5 text-muted-foreground/60">
                  or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={toggleAuthMethod}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {useMagicLink ? "Use email & password instead" : "Send me a magic link"}
            </Button>
          </>
        )}
      </div>

      {!useMagicLink && !magicLinkSent && (
        <div className="text-center text-sm text-muted-foreground">
          {mode === "sign-in" ? (
            <>
              Don&apos;t have an account?{" "}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setMode("sign-up")}
                className="h-auto p-0 text-foreground underline underline-offset-2 hover:text-foreground/80"
              >
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setMode("sign-in")}
                className="h-auto p-0 text-foreground underline underline-offset-2 hover:text-foreground/80"
              >
                Sign in
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
