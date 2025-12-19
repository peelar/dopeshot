# Look Authoring (domain)

Looks now live in `domain/look/looks.ts` and render components from `components/looks/`.

Use `apps/app/AUTHORING.md` for the full guide. The key steps:

- Build a Look component in `components/looks/` using `useLookPrimitives` and `LookSurface` for shared background/text handling.
- Register it in the `LOOKS` array with `lookId`, variants, and capabilities.
- Variants remain structural; Looks bundle styling primitives.
