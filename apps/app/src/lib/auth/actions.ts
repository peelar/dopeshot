"use client";

import { signIn, signUp, signOut, authClient } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import type { AuthResult } from "./types";

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const result = await signIn.email({
      email,
      password,
    });

    if (result.error) {
      return { error: { message: result.error.message || "Sign in failed" } };
    }

    track("auth_sign_in_success", {
      method: "email",
      user_id: result.data?.user?.id || "",
    });

    return {
      user: {
        id: result.data!.user!.id,
        email: result.data!.user!.email,
        createdAt: result.data!.user!.createdAt.toISOString(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed";
    return { error: { message } };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const result = await signUp.email({
      email,
      password,
      name: email.split("@")[0], // Use email username as default name
    });

    if (result.error) {
      return { error: { message: result.error.message || "Sign up failed" } };
    }

    track("auth_sign_up_success", {
      method: "email",
      user_id: result.data?.user?.id || "",
    });

    return {
      user: {
        id: result.data!.user!.id,
        email: result.data!.user!.email,
        createdAt: result.data!.user!.createdAt.toISOString(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign up failed";
    return { error: { message } };
  }
}

export async function signOutUser(): Promise<AuthResult> {
  try {
    await signOut();
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign out failed";
    return { error: { message } };
  }
}

export async function sendMagicLink(email: string): Promise<AuthResult> {
  try {
    const result = await signIn.magicLink({
      email,
      callbackURL: "/auth",
    });

    if (result.error) {
      return { error: { message: result.error.message || "Failed to send magic link" } };
    }

    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send magic link";
    return { error: { message } };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    track("auth_attempt", {
      method: "google",
    });

    await signIn.social({
      provider: "google",
      callbackURL: "/auth",
    });

    // Social sign-in redirects to OAuth provider, so we won't reach here
    // Success tracking happens after redirect callback
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign in with Google";
    track("auth_sign_in_error", {
      error: message,
      method: "google",
    });
    return { error: { message } };
  }
}
