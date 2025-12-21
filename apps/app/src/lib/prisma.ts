import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import invariant from "tiny-invariant";

invariant(process.env.DATABASE_URL, "DATABASE_URL must be defined");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const poolOptions = {
  connectionString: process.env.DATABASE_URL,
  max: Number.parseInt(process.env.PG_POOL_MAX ?? "10", 10),
  idleTimeoutMillis: Number.parseInt(process.env.PG_POOL_IDLE_TIMEOUT_MS ?? "10000", 10),
  connectionTimeoutMillis: Number.parseInt(
    process.env.PG_POOL_CONNECTION_TIMEOUT_MS ?? "10000",
    10,
  ),
};

// Create PostgreSQL connection pool
const pool = globalForPrisma.pool ?? new Pool(poolOptions);
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

// Optional: Graceful shutdown in production
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
