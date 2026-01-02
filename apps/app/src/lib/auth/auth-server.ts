import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import bcrypt from "bcryptjs";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { authEnv } from "./env";
import { prisma } from "@/lib/prisma";

// Initialize Resend client (only if API key is configured)
const resend = authEnv.resendApiKey ? new Resend(authEnv.resendApiKey) : null;

/**
 * Get trusted origins for Better Auth
 * In development: allows all localhost/127.0.0.1 ports
 * In production: only the configured base URL
 */
function normalizeOrigin(url?: string) {
  if (!url) return null;

  try {
    return new URL(url).origin;
  } catch (error) {
    console.warn(`[Auth] Unable to parse origin from URL: ${url}`, error);
    return null;
  }
}

function getTrustedOrigins(): string[] {
  const origins = new Set<string>();

  const addOrigin = (origin?: string | null) => {
    if (origin) origins.add(origin);
  };

  addOrigin(normalizeOrigin(authEnv.betterAuthUrl));
  addOrigin(normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL));

  const additionalOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",");
  additionalOrigins?.forEach((origin) => addOrigin(normalizeOrigin(origin.trim())));

  if (process.env.NODE_ENV === "development") {
    // Allow common dev ports for both localhost and 127.0.0.1
    const localhostOrigins = [3000, 3001, 3002].flatMap((port) => [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
    ]);

    localhostOrigins.forEach((origin) => addOrigin(origin));
  }

  return Array.from(origins);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Enable later with email service
    password: {
      // Use bcrypt to match Supabase Auth's password hashing
      hash: async (password) => await bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => await bcrypt.compare(password, hash),
    },
  },
  // Social authentication providers
  socialProviders: {
    google: {
      clientId: authEnv.googleClientId,
      clientSecret: authEnv.googleClientSecret,
      enabled: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
  secret: authEnv.betterAuthSecret,
  baseURL: authEnv.betterAuthUrl,
  trustedOrigins: getTrustedOrigins(),

  // Auto-create related records on user signup
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Normalize email before creation
          return {
            data: {
              ...user,
              email: user?.email?.toLowerCase(),
            },
          };
        },
        after: async (user) => {
          // Create related records after user creation
          await prisma.$transaction([
            prisma.brandProfile.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                // Empty profile - filled during onboarding
              },
              update: {},
            }),
            prisma.userMetadata.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                exportsThisMonth: 0,
              },
              update: {},
            }),
          ]);
        },
      },
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url, token }, request) => {
        if (!resend) {
          console.error("Resend API key not configured - cannot send magic link");
          throw new Error("Email service not configured");
        }

        // In development, replace the baseURL with the actual request origin
        // This ensures magic links work regardless of which port you're using
        let finalUrl = url;
        if (process.env.NODE_ENV === "development" && request?.headers) {
          const origin = request.headers.get("origin") || request.headers.get("referer");
          if (origin) {
            const requestOrigin = new URL(origin).origin;
            const configuredOrigin = new URL(authEnv.betterAuthUrl).origin;
            finalUrl = url.replace(configuredOrigin, requestOrigin);
            console.log(`[Magic Link] Adjusted URL from ${url} to ${finalUrl}`);
          }
        }

        try {
          const result = await resend.emails.send({
            from: "dopeshot <auth@dopeshot.io>",
            to: email,
            subject: "Sign in to dopeshot",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Sign in to dopeshot</h2>
                <p>Click the button below to sign in to your account:</p>
                <a href="${finalUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                  Sign In
                </a>
                <p style="color: #666; font-size: 14px;">This link will expire in 5 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            `,
          });

          console.log("Magic link email sent successfully:", result);

          if (result.error) {
            console.error("Resend API error:", result.error);
            throw new Error(result.error.message);
          }
        } catch (error) {
          console.error("Failed to send magic link email:", error);
          throw error;
        }
      },
      expiresIn: 60 * 5, // 5 minutes
    }),
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
