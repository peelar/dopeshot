# Research: Asset Type Selector (Screenshot vs Code)

## Overview
dopeshot currently treats “Screenshot looks” (Peak, Spotlight, Backdrop) and the “Code” look as part of one rail. The requested feature is an **asset type** selector that:
- Persists active mode (`Screenshot` / `Code`)
- Filters the looks rail based on mode
- Ensures each mode remembers its last selected look
- Updates header upload affordances (hide/adjust in Code mode)

## Key Files & Locations
| File | Purpose | Key Lines |
|------|---------|-----------|
| `components/look-selector.tsx` | Looks rail UI and look switching logic | 1 |
| `domain/look/definitions.ts` | Look definitions + `supportsScreenshots()` capability check | 1 |
| `hooks/atoms.ts` | Global Jotai atoms (current config, assets, etc.) | 1 |
| `hooks/use-playground-controller.ts` | Header props, export gating, drag/upload wiring | 1 |
| `components/app-header.tsx` | Upload + export buttons in the sticky header | 1 |
| `components/mobile-actions.tsx` | Mobile upload button + sheet actions | 1 |
| `components/layout-config.tsx` | Sidebar sections; already switches for `code-snippet` | 1 |

## Architecture & Data Flow
- The current look is stored in `configAtom` (`LayoutConfig.lookId`), updated primarily by `components/look-selector.tsx`.
- Sidebar sections are already conditional on the current look:
  - `components/layout-config.tsx` shows `CodeSection` only when `config.lookId === "code-snippet"`.
- “Screenshot vs non-screenshot” distinctions already exist via `supportsScreenshots(lookId)` in `domain/look/definitions.ts`.

## Patterns to Follow
- Use Jotai atoms for app-level state (`hooks/atoms.ts`) and derived atoms (`hooks/atoms/derived.ts`).
- For UI dropdowns, the project already has a shadcn/Radix `Select` component with built-in checkmarks:
  - `components/ui/select.tsx` (`SelectItem` renders check indicator).

## Recommendations
- Add a persisted `assetType` atom (localStorage-backed) plus persisted “last look per asset type”.
- Render the selector in `components/look-selector.tsx` by replacing the “Look” label row with a `Select` trigger that reads `LOOK · {mode}`.
- Filter the rail:
  - Screenshot mode → looks where `capabilities.screenshot === "supported"`
  - Code mode → only `lookId === "code-snippet"`
- Ensure export works for Code mode by gating “requires screenshot” on the current look’s screenshot capability (not on `config.assets.screenshot` alone).
