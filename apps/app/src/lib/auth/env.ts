function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function resolveBetterAuthUrl(): string {
  const envUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  throw new Error("Missing required environment variable: BETTER_AUTH_URL");
}

export const authEnv = {
  databaseUrl: getEnvVar("DATABASE_URL"),
  betterAuthSecret: getEnvVar("BETTER_AUTH_SECRET"),
  betterAuthUrl: resolveBetterAuthUrl(),
  resendApiKey: process.env.RESEND_API_KEY, // Optional - only needed for magic links
} as const;
