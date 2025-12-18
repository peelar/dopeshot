function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const authEnv = {
  databaseUrl: getEnvVar("DATABASE_URL"),
  betterAuthSecret: getEnvVar("BETTER_AUTH_SECRET"),
  betterAuthUrl: getEnvVar("BETTER_AUTH_URL"),
  resendApiKey: process.env.RESEND_API_KEY, // Optional - only needed for magic links
} as const;
