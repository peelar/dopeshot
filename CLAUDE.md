# AGENTS.md

## Overview

dopeshot is the visual identity toolkit for indie hackers and small builders. As a main focus, it formats and nicely wraps a screenshot (product photo, code snippet) but in the future it will also support other use cases.

The editor is fully client-side. There are no user accounts, no cloud persistence, and no paywall. Brand settings live in `localStorage` (`dopeshot:brandSettings`). Uploaded backgrounds exist for the current session only. Catalog backgrounds are static files in `apps/app/public/backgrounds/catalog/`.

## Map

- [Product](docs/product/index.md) - homepage for all the documentation regarding the product
- [Folder Structure](docs/development/folder-structure.md) - guide to the src/ directory structure and where to put new code

## Rules

- Focus on creating a delightful front-end experience. Make sure the UI is easy to use, understan and snappy.
- When building UI components, use Base UI (`@base-ui/react`) for primitives. Style them with Tailwind.
- Avoid new catch-all `utils.ts`; collocate helpers or use domain-specific modules.
- Use pnpm.
- Propose using `knip` to clean up after building a bigger feature.
- Use Jotai for state management, especially for global state. Prefer atoms over prop drilling and callback chains.
- Keep the Design sidebar for styling; look/variant switching stays in the rail/toggle above the canvas.
- Be very hesitant about adding something new to the sidebar. It should be as intelligent as possible, with no extra clicks or steps.
- Actively look for ways to refactor crucial parts of the codebase.
- Add a Changeset for any user-facing change or code change that should appear in the changelog; use `pnpm changeset` and commit the generated file.
- After you are done with implementation, verify if the types & tests work via scripts in `package.json`.
- Whenever you have "a bigger fix" in mind or a refactor, go for it. We are building for tomorrow, not today.
- **Always add tracking events** for all new user-facing functionalities using `track()` from `@/lib/analytics`. Only track relevant product metrics.
- **Always add test coverage** for new features and functionality. Follow the testing strategy documented in `thoughts/research/009-export-testing-strategy.md`:
  - **Unit tests** (Vitest) for pure functions and utilities
  - **Component tests** (Vitest + React Testing Library) for UI components
  - **Integration tests** (Playwright) for E2E workflows
  - **Visual regression tests** (Playwright) for layout/UI changes when applicable
  - **Edge case tests** for boundary conditions and error handling
  - A feature is not complete until it has appropriate test coverage. Run `pnpm test:ui` and `pnpm test:e2e` to verify tests pass before considering implementation done.

## Active Technologies

- TypeScript 5.x, Next.js 16, React 19, Jotai
- Static catalog backgrounds in `public/backgrounds/catalog/`
