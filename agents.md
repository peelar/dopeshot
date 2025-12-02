# Agent Guide

## Purpose

Single source of truth for agents working on cover-forge. Keep it short, actionable, and repo-specific.

## Product Documentation

For all product documentation, see the [Product](product/index.md) folder.

## Rules

- Focus on creating a delightful front-end experience. Make sure the UI is easy to use, understan and snappy.
- Avoid new catch-all `utils.ts`; collocate helpers or use domain-specific modules.
- Default to Tailwind and local components; keep global CSS light.
- Maintain ASCII unless the file already uses other characters.
- Use shadcn/ui CLI to generate components.
- Use pnpm.
- Use Jotai for state management, especially for global state. Prefer atoms over prop drilling and callback chains.
- You will be given PRDs or similar instructions to follow. You have the authority to make decisions about the implementation.
- Don’t mention underlying tech in UI copy (e.g., avoid “Upload with Supabase”).
- Favor existing shadcn-style primitives before building new components.
- Keep the Design sidebar for styling; template/layout switching stays in the rail/toggle above the canvas.
- Be very hesitant about adding something new to the sidebar. It should be as intelligent as possible, with no extra clicks or steps.
- Add UI comments only when clarifying non-obvious logic.
