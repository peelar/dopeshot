# Folder Structure Guide

## Overview

dopeshot uses a `src/` directory pattern following Next.js 15 best practices and AI-friendly vertical slice architecture. This structure separates source code from configuration, groups related code by feature, and provides clear conventions for where new code belongs.

**Last Updated**: December 2025
**Migration Completed**: December 19, 2025

## Why src/ Structure?

**Benefits:**
- **Clear Separation**: Source code separated from configuration files
- **AI-Friendly**: Easy to navigate and understand for both humans and AI assistants
- **Scalable**: Room to grow without root-level clutter
- **Next.js Standard**: Follows official Next.js recommendations

**Before Migration**: 51+ items at root level (source + config mixed)
**After Migration**: ~30 items at root level (config only)

## Directory Structure

```
dopeshot/
├── src/                          # All application source code
│   ├── app/                      # Next.js App Router (routes & pages)
│   ├── components/               # React components
│   ├── domain/                   # Business logic & data models
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Utilities & services
├── public/                        # Static assets (images, fonts, etc.)
├── tests/                         # Test suite
├── docs/                          # Technical documentation
├── thoughts/                      # Claude command outputs
├── scripts/                       # Build & migration scripts
├── supabase/                      # Database & auth config
└── [config files]                 # TypeScript, Next.js, Tailwind, etc.
```

## src/ Directory Structure

### 📁 src/app/ - Next.js App Router

Routes, pages, API endpoints, and layouts following Next.js App Router conventions.

```
src/app/
├── (playground)/              # Route group (not in URL)
│   ├── _components/           # Page-specific components (private)
│   │   ├── playground-page.tsx
│   │   ├── playground-workspace.tsx
│   │   ├── preview-viewport.tsx
│   │   └── drag-overlay.tsx
│   └── page.tsx               # Playground route (main page)
├── auth/
│   └── page.tsx               # Auth page
├── api/                       # API routes
│   ├── auth/
│   ├── brand/
│   └── generate-gradient/
├── layout.tsx                 # Root layout
├── globals.css                # Global styles
├── global-error.tsx           # Error boundary
└── page.tsx                   # Home page (/)
```

**Conventions:**
- `(folder)/` - Route group (organizational only, not in URL)
- `_folder/` - Private folder (not publicly accessible as route)
- `page.tsx` - Defines a route
- `layout.tsx` - Shared layout for nested routes
- `route.ts` - API endpoint

### 📁 src/components/ - React Components

Reusable UI components organized by purpose.

```
src/components/
├── ui/                        # shadcn/ui primitives
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   └── ...
├── layout/                    # App chrome & shell
│   ├── app-header.tsx
│   ├── sidebar-tabs.tsx
│   └── mobile-actions.tsx
├── selectors/                 # Feature selectors
│   ├── layout-selector.tsx
│   ├── font-selector.tsx
│   ├── font-style-selector.tsx
│   ├── gradient-picker.tsx
│   └── screenshot-zoom-slider.tsx
├── sidebar/                   # Sidebar feature sections
│   ├── design-section.tsx
│   ├── brand-section.tsx
│   ├── screenshot-section.tsx
│   └── ...
├── config/                    # Configuration UI
│   └── layout-config.tsx
├── providers/                 # App-wide providers
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── umami-provider.tsx
├── layouts/                   # Screenshot layout components
│   ├── AdaptiveScreenshot.tsx
│   ├── CodeSnippet.tsx
│   ├── HeroCenter.tsx
│   └── shared/
├── auth/                      # Authentication UI
├── brand/                     # Brand profile UI
├── onboarding/                # Onboarding flow UI
└── cover-preview.tsx          # Shared utility component
```

### 📁 src/domain/ - Business Logic

Pure business logic, data models, and algorithms. No UI dependencies.

```
src/domain/
├── asset/                     # Asset upload & metadata
├── code/                      # Code language detection
├── demo/                      # Demo presets
├── gradient-generation/       # Gradient algorithms
├── layout/                    # Layout models & config
│   └── gradients/             # Gradient types & utilities
└── layout-def/                # Layout definitions & authoring
```

**Conventions:**
- Each domain module has its own README.md
- Pure TypeScript (no React dependencies)
- Self-contained with clear boundaries

### 📁 src/hooks/ - Custom React Hooks

React hooks for state management and side effects.

```
src/hooks/
├── atoms/                     # Jotai atom definitions (nested)
├── atoms.ts                   # Main atom exports
├── use-onboarding-flow.ts
├── use-brand-logo-auto-apply.ts
├── use-playground-controller.ts
├── use-file-upload.ts
└── ...
```

### 📁 src/lib/ - Utilities & Services

Shared utilities, services, and configurations.

```
src/lib/
├── utils/                     # Utility functions
│   └── cn.ts                  # className utility
├── config/                    # App configuration
│   ├── instrumentation.ts
│   ├── instrumentation-client.ts
│   ├── sentry.server.ts
│   └── sentry.edge.ts
├── auth/                      # Auth utilities (better-auth)
├── analytics.ts               # Event tracking
├── feature-flags.ts           # Feature flag management
├── sentry.ts                  # Sentry integration
├── supabase-admin.ts          # Supabase admin client
└── supabase-db.ts             # Supabase database client
```

## Where to Put New Code

### Decision Flowchart

```
Is it a new route/page?
└─ Yes → src/app/{route}/page.tsx

Is it UI specific to one page?
└─ Yes → src/app/(route-group)/_components/

Is it a reusable UI component?
├─ Shadcn primitive? → src/components/ui/
├─ App shell (header, sidebar)? → src/components/layout/
├─ Feature selector? → src/components/selectors/
├─ Sidebar section? → src/components/sidebar/
├─ Provider? → src/components/providers/
└─ Other shared component → src/components/ (root or create new category)

Is it business logic?
└─ Yes → src/domain/{feature}/

Is it a React hook?
└─ Yes → src/hooks/

Is it a utility or service?
├─ Auth-related? → src/lib/auth/
├─ Utility function? → src/lib/utils/
└─ Other service → src/lib/
```

### Examples

**Adding a new gradient algorithm:**
```
src/domain/gradient-generation/
└── new-algorithm.ts
```

**Adding a font weight selector:**
```
src/components/selectors/
└── font-weight-selector.tsx
```

**Adding page-specific helper for playground:**
```
src/app/(playground)/_components/
└── canvas-helper.tsx
```

**Adding a new API endpoint:**
```
src/app/api/export/
└── route.ts
```

**Adding authentication helper:**
```
src/lib/auth/
└── session-helper.ts
```

## Import Path Conventions

All imports use the `@/` alias pointing to `src/`:

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button"
import { LayoutSelector } from "@/components/selectors/layout-selector"
import { generateGradient } from "@/domain/gradient-generation"
import { usePlaygroundController } from "@/hooks/use-playground-controller"
import { cn } from "@/lib/utils/cn"

// ❌ Incorrect (don't use relative paths for cross-directory imports)
import { Button } from "../../../components/ui/button"
```

### Import Path Reference

```
@/app/                         → src/app/
@/components/                  → src/components/
@/domain/                      → src/domain/
@/hooks/                       → src/hooks/
@/lib/                         → src/lib/
```

## Component Organization Patterns

### Page-Specific Components

Components used only on a single page should be colocated with that page using `_components/`:

```
src/app/(playground)/
├── _components/               # Only used by playground page
│   ├── playground-page.tsx
│   ├── playground-workspace.tsx
│   └── preview-viewport.tsx
└── page.tsx                   # Imports from _components/
```

**Why?**
- Clear locality of behavior
- Easy to find related code
- Prevents false sharing

### Shared Components

Components used across multiple features go in `src/components/` with semantic grouping:

```
src/components/
├── layout/                    # App chrome (header, sidebar chrome)
├── selectors/                 # Feature selectors (layout, font, gradient)
├── sidebar/                   # Sidebar content sections
├── config/                    # Configuration UI
└── providers/                 # App-wide providers
```

### Domain Layer

Business logic with zero UI dependencies:

```
src/domain/gradient-generation/
├── README.md                  # Module documentation
├── types.ts                   # Type definitions
├── generator.ts               # Core algorithm
├── color-analysis.ts          # Color utilities
└── __tests__/                 # Unit tests (if using)
```

## Testing Organization

```
tests/
├── ui/                        # Component tests (Vitest + RTL)
├── e2e/                       # End-to-end tests (Playwright)
├── fixtures/                  # Test fixtures & mock data
└── helpers/                   # Test utilities
```

**Note:** Tests directory stays at root (common pattern). Could move to `src/tests/` in future if preferred.

## Migration History

**Date**: December 19, 2025
**From**: Flat structure with source mixed at root
**To**: src/ structure with semantic organization

**Key Changes:**
1. Adopted `src/` directory pattern
2. Reorganized 17 root-level components into 6 semantic groups
3. Colocated page-specific components with routes using `_components/`
4. Renamed `sidebar-sections/` → `sidebar/` for clarity
5. Moved `utils.ts` → `src/lib/utils/cn.ts` (avoiding catch-all utils pattern)
6. Updated all import paths to use `@/` alias pointing to `src/`

**Benefits Realized:**
- ✅ Root directory reduced from 51+ items to ~30
- ✅ Clear "where does this go?" conventions
- ✅ AI-friendly navigation
- ✅ Scalable architecture for future growth

## Additional Resources

- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [LLM-Oriented Programming](https://kdubovikov.xyz/articles/programming/llm-oriented-programming)
- [Next.js App Router](https://nextjs.org/docs/app)
- [CLAUDE.md](/CLAUDE.md) - Project-specific coding guidelines

## Notes

- **thoughts/**: Output directory for Claude slash commands (not general documentation)
- **docs/**: Technical documentation about how things work
- **Instrumentation files**: Next.js requires entry points at root, implementations in `src/lib/config/`
- **No catch-all utils**: Avoid creating `utils.ts` - use specific modules or collocate helpers
