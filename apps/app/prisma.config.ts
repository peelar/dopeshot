import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import invariant from "tiny-invariant";
import { existsSync } from "fs";

// Load environment variables from .env.local (development) if it exists
// In production (Vercel, etc.), environment variables are injected directly
if (existsSync(".env.local")) {
  config({ path: ".env.local" });
}

invariant(process.env.DATABASE_URL, "DATABASE_URL must be defined");

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
