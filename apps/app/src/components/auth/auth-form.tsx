"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, signInWithEmail, signUpWithEmail, signOutUser, sendMagicLink, signInWithGoogle } from "@/lib/auth";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    const handler =
      mode === "sign-in"
        ? () => signInWithEmail(trimmedEmail, form.password)
        : () => signUpWithEmail(trimmedEmail, form.password);

    const { error } = await handler();

    setIsSubmitting(false);

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

    setIsSubmitting(true);

    const { error } = await sendMagicLink(trimmedEmail);

    setIsSubmitting(false);

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

  const handleGoogleSignIn = async () => {
    setStatus(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setStatus({ type: "error", message: error.message });
    }
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
    if (useMagicLink) return "";
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
          <>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="h-12 w-full rounded-lg border border-border/50 bg-muted/40 text-foreground hover:bg-muted/60 hover:text-foreground"
              variant="outline"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

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
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting
                ? useMagicLink
                  ? "Sending..."
                  : mode === "sign-in"
                    ? "Signing in..."
                    : "Creating account..."
                : useMagicLink
                  ? "Send magic link"
                  : mode === "sign-in"
                    ? "Sign in"
                    : "Create account"}
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

          {!magicLinkSent && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={toggleAuthMethod}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {useMagicLink ? "Use email & password" : "Send me a magic link"}
            </Button>
          )}
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
