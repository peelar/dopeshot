# Tooling Playbook for Coding Agents
This repo needs repeatable tooling so any agent—without prior knowledge—can check type safety, Component/UI behavior, and real user journeys. Follow this playbook step-by-step.

## Goals
- Surface a `typecheck` command that runs `tsc --noEmit`.
- Keep existing domain-focused tests (`tests/color-*`, `tests/gradient-*`) and wrap them in named scripts.
- Add Vitest + React Testing Library for component/UI regression coverage.
- Add Playwright for End-to-End coverage (drag/upload, look navigation, export flow).
- Give the coding agent a single `pnpm run check` umbrella script plus focused scripts for targeted verification.
- Document how to run each step and what success looks like.

## Current baseline
- `package.json` already has `dev`, `build`, `start`, `lint`, `knip`, and `test:colors` using `tsx`.
- Domain logic tests live under `tests/` and depend on `generateGradientFromImage`, `extractPaletteFromImage`, and a `helpers/image-factory`.
- No automated UI or E2E tests exist yet; no typecheck script.

## Implementation roadmap for the next agent
1. **Package scripts**
   - Add `typecheck`: run `tsc --noEmit`.
   - Rename `test:colors` to `test:domain` (same commands) so names match scope.
   - Add `test:ui`: run `vitest run` (see Vitest config below).
   - Add `test:e2e`: run `pnpm playwright test`.
   - Add `check`: `pnpm lint && pnpm typecheck && pnpm test:domain && pnpm test:ui && pnpm test:e2e`.

2. **Vitest setup**
   - Install dev dependencies: `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `@testing-library/react`, `@testing-library/dom`.
   - Create `vitest.config.ts` with `defineConfig`, `plugins: [tsconfigPaths(), react()]`, and `test.environment = "jsdom"`.
   - Use `tsconfigPaths()` so alias `@/` works.
   - Add UI tests under `tests/ui/` that render key components (e.g., `AppHeader`, `PlaygroundWorkspace`, `LookSelector`) via `render` and assert visible controls, text, and stateful behavior (buttons, loading indicators).

3. **Playwright setup**
   - Run `pnpm create playwright` (or follow docs) to scaffold `playwright.config.ts` and install browsers.
   - Use `webServer` to run `pnpm dev` (or `pnpm build && pnpm start` for CI) with `url: http://127.0.0.1:3000`.
   - Write at least one spec in `tests/e2e/` covering:
     * the landing page renders the Playground.
     * drag-and-drop upload flow (simulate file pick, check status message).
     * look selector changes (tap variant buttons and ensure preview updates).
     * export workflow (click Export and ensure expected DOM updates or file download stub).
   - Configure Playwright base URL and test options per Next.js docs.

4. **Documentation & agent instructions**
   - Update `agents.md` (or add a dedicated `TOOLING_AUTONOMOUS_PLAN.md` reference) to explain how to run each script.
   - Outline how the coding agent should verify changes:
     * `pnpm install` (once).
     * `pnpm lint`.
     * `pnpm typecheck`.
     * `pnpm test:domain`.
     * `pnpm test:ui`.
     * `pnpm test:e2e`.
     * Prefer `pnpm run check` for full validation, but run focused scripts when iterating.
   - Mention Playwright specifics: start the dev server via `pnpm dev` or rely on `webServer`; keep browsers headless in CI, headed locally.

5. **CI/Automation hooks**
   - Add GitHub Actions (optional) or mention hooking `pnpm run check` in CI to keep tests green.
   - Encourage caching `pnpm` store for faster installs.

## Verification expectations
- Typecheck passes if `tsc --noEmit` exits 0.
- Domain tests pass when all `tsx` scripts finish successfully.
- UI tests pass when Vitest exits 0 with coverage (if added).
- E2E tests pass when Playwright completes against a running Next.js server; watch for console errors.
- Document any required environment variables (e.g., for Playwright) in `.env.test` or `.env.local` if needed.

## Coding agent checklist
1. Run `pnpm install`.
2. Run `pnpm dev` in background if Playwright uses `webServer`; otherwise rely on the config.
3. Execute:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test:domain`
   - `pnpm test:ui`
   - `pnpm test:e2e`
4. Capture outputs and include summaries (pass/fail, runtime logs, notable warnings).
5. If any step fails, rerun the failing command with `DEBUG=1` (for Playwright/Vitest) and gather logs.
6. Optionally run `pnpm run check` to cover everything at once once fixes are merged.

## References
- Next.js testing guide: [docs/app/guides/testing](https://nextjs.org/docs/app/guides/testing).
- Vitest setup: [docs/app/guides/testing/vitest](https://nextjs.org/docs/app/guides/testing/vitest).
- Playwright guide: [docs/app/guides/testing/playwright](https://nextjs.org/docs/app/guides/testing/playwright).
