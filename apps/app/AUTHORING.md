# Look Authoring Guide

This guide explains how to create a new Look for the layout system.

## Overview

A Look is built from shared primitives (gradient, frame, typography tokens, flex layout) and registered so it shows up in the Look rail.

1. **Look Component**: A React component that renders the look using shared primitives.
2. **Look Registration**: An entry in the `LOOKS` array in `domain/look/looks.ts`.

## 1. Create the Look Component

Create a new file in `components/looks/` (e.g., `components/looks/MyNewLook.tsx`). Prefer the shared helpers to avoid bespoke logic:

- `useLookPrimitives` for config, assets, background styles, text tokens, and screenshot treatment.
- `LookSurface` to render the background + pattern overlay wrapper.

```tsx
import { memo } from "react";
import { LookSurface, useLookPrimitives } from "@/components/looks/shared/look-primitives";

function MyNewLookComponent() {
  const { assets, assetMap, backgroundStyle, config, screenshot, text } = useLookPrimitives();

  return (
    <LookSurface
      backgroundStyle={backgroundStyle}
      assets={assets}
      config={config}
      assetMap={assetMap}
      screenshot={screenshot}
    >
      <div className="relative z-10 h-full w-full">
        <h1 className={text.fontSize.titleClass} style={text.titleStyle}>
          {text.title}
        </h1>
        {/* ... */}
      </div>
    </LookSurface>
  );
}

export const MyNewLook = memo(MyNewLookComponent);
```

## 2. Register the Look

Open `domain/look/looks.ts` and add a new entry to the `LOOKS` array.

```typescript
import { MyNewLook } from "@/components/looks/MyNewLook";

export const LOOKS: Look[] = [
  // ... existing looks
  {
    id: "my-new-look",
    name: "My New Look",
    description: "A brief description of what this look delivers.",
    variants: ["left", "right"], // Variants stay structural.
    createConfig: () => ({
      lookId: "my-new-look",
      variant: "left",
      text: {
        title: "Default Title",
        subtitle: "Default Subtitle",
      },
      colors: {
        background: "slate-50",
        text: "slate-900",
        accent: "indigo-500",
      },
      assets: {
        screenshot: undefined,
        logo: undefined,
      },
      background: {
        type: "gradient",
        value: "custom",
        grainEnabled: true,
        patternMode: "auto",
      },
    }),
    component: MyNewLook,
    capabilities: {
      focusMode: "auto",
      canvasBehavior: "adaptive",
      text: { headline: "optional", subtitle: "optional" },
      typography: true,
      outline: { softGlass: true, shape: true, shadow: true },
      logo: "supported",
    },
  },
];
```

## 3. Verification

Once registered, each Look and its variants appear in the Look rail and Variant toggle automatically.
