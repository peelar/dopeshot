import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { existsSync } from "fs";

// Load environment variables from .env.local (development) if it exists
// In production (Vercel, etc.), environment variables are injected directly
if (existsSync(".env.local")) {
  config({ path: ".env.local" });
}

export default defineConfig({
  datasource: {
    // DATABASE_URL can be undefined during `prisma generate` in CI
    // It will be validated at runtime when the Prisma client connects
    url: process.env.DIRECT_URL,
    // DIRECT_URL is required for migrations when using connection pooling (pgbouncer)
    // Migrations need direct connection (port 5432), not pooled (port 6543)
    // directUrl: process.env.DIRECT_URL,
  },
});
