# AGENTS.md

## Overview

dopeshot is the visual identity toolkit for indie hackers and small builders. As a main focus, it formats and nicely wraps a screenshot (product photo, code snippet) but in the future it will also support other use cases.

## Map

- [Product](docs/product/index.md) - homepage for all the documentation regarding the product

## Rules

- Focus on creating a delightful front-end experience. Make sure the UI is easy to use, understan and snappy.
- When building UI components, use shadcn/ui CLI for primitives. Style them with Tailwind.
- Avoid new catch-all `utils.ts`; collocate helpers or use domain-specific modules.
- Use pnpm.
- Propose using `knip` to clean up after building a bigger feature.
- Use Jotai for state management, especially for global state. Prefer atoms over prop drilling and callback chains.
- Keep the Design sidebar for styling; look/variant switching stays in the rail/toggle above the canvas.
- Be very hesitant about adding something new to the sidebar. It should be as intelligent as possible, with no extra clicks or steps.
- Actively look for ways to refactor crucial parts of the codebase.
- After you are done with implementation, verify if the types & tests work via scripts in `package.json`.
