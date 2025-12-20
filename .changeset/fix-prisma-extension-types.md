---
"dopeshot-app": patch
---

Fix Prisma configuration and type safety:
- Use Prisma.defineExtension for automatic type inference in Client Extensions, eliminating implicit any types
- Replace unsafe `as any` casts with type-safe Record<string, unknown> assertions
- Fix prisma.config.ts to conditionally load .env.local (development) while allowing environment variables to be injected in production deployments
