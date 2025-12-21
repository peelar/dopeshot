---
"dopeshot-app": patch
---

Fix Prisma configuration and type safety:
- Add postinstall script to generate Prisma client in CI/deployments
- Remove DATABASE_URL invariant check from prisma.config.ts that was blocking client generation in CI (validation now happens at runtime when connecting)
- Use Prisma.defineExtension for automatic type inference in Client Extensions, eliminating implicit any types
- Replace unsafe `as any` casts with type-safe Record<string, unknown> assertions
- Fix prisma.config.ts to conditionally load .env.local (development) while allowing environment variables to be injected in production deployments
