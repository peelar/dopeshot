# Template Authoring Guide

This guide explains how to create a new template for the layout system.

## Overview

A template consists of two main parts:

1. **Template Component**: A React component that renders the layout.
2. **Template Registration**: An entry in the `TEMPLATES` array in `domain/layout/templates.ts`.

## 1. Create the Template Component

Create a new file in `components/templates/` (e.g., `components/templates/MyNewTemplate.tsx`).

The component should accept the following props:

```typescript
interface MyNewTemplateProps {
  config: LayoutConfig;
  assets?: Asset[];
  className?: string;
}
```

### Key Requirements

- **Dimensions**: The component must handle being rendered in a container with a `16:9` aspect ratio (specifically `1280x720` pixels base).
- **Styling**: Use Tailwind CSS for styling.
- **Assets**: Resolve assets (screenshot, logo) using the `assets` array and `config.assets` IDs.
- **Text**: Render `config.text.title` and `config.text.subtitle`.
- **Colors**: Use `config.colors` to style background and text. You may need helper functions like `tokenToCssColor` or `tokenToTextColorClass` to map `ColorToken` values to CSS values or Tailwind classes.
- **Variants**: Implement logic to handle different `config.variant` values (e.g., "left", "right", "center") if your template supports multiple layouts.

### Example Structure

```tsx
import { LayoutConfig } from "@/domain/layout/types";
import { Asset } from "@/domain/asset/types";
import { cn } from "@/utils";

// ... helper functions for colors ...

export function MyNewTemplate({ config, assets = [], className }: MyNewTemplateProps) {
  // 1. Resolve assets
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const screenshot = config.assets.screenshot ? assetMap.get(config.assets.screenshot) : null;

  // 2. Determine layout/variant
  const variant = config.variant || "default";

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {/* Render content based on config */}
      <h1>{config.text.title}</h1>
      {/* ... */}
    </div>
  );
}
```

## 2. Register the Template

Open `domain/layout/templates.ts` and add a new entry to the `TEMPLATES` array.

```typescript
import { MyNewTemplate } from "@/components/templates/MyNewTemplate";

export const TEMPLATES: Template[] = [
  // ... existing templates
  {
    id: "my-new-template",
    name: "My New Template",
    description: "A brief description of what this template looks like.",
    variants: ["left", "right"], // Define supported variants. All variants will appear as distinct options in the UI.
    createConfig: () => ({
      templateId: "my-new-template",
      variant: "left", // Default variant
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
    }),
    component: MyNewTemplate,
  },
];
```

## 3. Verification

Once registered, **every variant** you defined (e.g., "left", "right") will automatically appear as a separate, selectable option in the top `TemplateSelector` bar.
