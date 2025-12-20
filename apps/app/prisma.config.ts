import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import invariant from "tiny-invariant";

// Load environment variables from .env.local
config({ path: ".env.local" });

invariant(process.env.DATABASE_URL, "DATABASE_URL must be defined");

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
