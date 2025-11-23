import {
  LayoutConfig,
  LayoutPrimitive,
  LayoutTheme,
  ScreenshotPrimitive,
  TextBlockPrimitive,
  BackgroundPrimitive,
} from "./types";

/**
 * Generates a unique ID for primitives and layouts.
 */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a minimal, valid LayoutConfig for a new composition.
 * Uses Tailwind-aligned tokens for colors.
 *
 * @param options Optional overrides for the default theme.
 * @returns A new LayoutConfig object.
 */
export function createDefaultLayoutConfig(options?: {
  themeOverrides?: Partial<LayoutTheme>;
}): LayoutConfig {
  const defaultTheme: LayoutTheme = {
    backgroundColor: "slate-50",
    accentColor: "violet-500",
    textColor: "slate-950",
    mutedTextColor: "slate-500",
    screenshotFrameColor: "slate-200",
    defaultTitleFontId: "inter",
    defaultBodyFontId: "inter",
    ...options?.themeOverrides,
  };

  const background: BackgroundPrimitive = {
    id: generateId(),
    type: "background",
    gridColumnStart: 1,
    gridColumnEnd: 13,
    gridRowStart: 1,
    gridRowEnd: 7,
    zIndex: 0,
    variant: "solid",
    colorPrimary: defaultTheme.backgroundColor,
  };

  // Title on the left side, middle rows (Cols 2-7, Rows 3-4)
  const title: TextBlockPrimitive = {
    id: generateId(),
    type: "textBlock",
    role: "title",
    text: "New Project",
    gridColumnStart: 2,
    gridColumnEnd: 7,
    gridRowStart: 3,
    gridRowEnd: 4,
    zIndex: 10,
    horizontalAlign: "left",
    verticalAlign: "middle",
    fontId: defaultTheme.defaultTitleFontId,
    fontWeightToken: "bold",
    fontSizeToken: "3xl",
  };

  return {
    id: generateId(),
    gridColumns: 12,
    gridRows: 6,
    theme: defaultTheme,
    primitives: [background, title],
  };
}

/**
 * Adds a screenshot primitive to the layout.
 * Default placement: Bottom-right region (Cols 7-12, Rows 3-6).
 *
 * @param layout The current layout configuration.
 * @param params Parameters for the new screenshot (e.g., assetId).
 * @returns A new LayoutConfig with the screenshot added.
 */
export function addScreenshotPrimitive(
  layout: LayoutConfig,
  params: { assetId: string },
): LayoutConfig {
  // Bottom-right region: Cols 7-12 (start 7, end 13), Rows 3-6 (start 3, end 7)
  const screenshot: ScreenshotPrimitive = {
    id: generateId(),
    type: "screenshot",
    assetId: params.assetId,
    gridColumnStart: 7,
    gridColumnEnd: 13,
    gridRowStart: 3,
    gridRowEnd: 7,
    zIndex: 5,
    shadowStyle: "soft",
    borderRadiusPx: 16,
    cropStyle: "bottomCut",
  };

  let primitives = [...layout.primitives];

  // Avoid overlapping existing title text
  primitives = primitives.map((p) => {
    if (p.type === "textBlock" && (p as TextBlockPrimitive).role === "title") {
      if (
        rectsIntersect(
          p.gridColumnStart,
          p.gridColumnEnd,
          p.gridRowStart,
          p.gridRowEnd,
          screenshot.gridColumnStart,
          screenshot.gridColumnEnd,
          screenshot.gridRowStart,
          screenshot.gridRowEnd,
        )
      ) {
        // Collision detected.
        // Try to move title up or left to avoid the screenshot.
        const newP = { ...p };

        // Strategy: Prefer moving up if there's space
        const height = newP.gridRowEnd - newP.gridRowStart;
        if (screenshot.gridRowStart > height + 1) {
          // Place above screenshot
          newP.gridRowStart = Math.max(1, screenshot.gridRowStart - height);
          newP.gridRowEnd = newP.gridRowStart + height;
        } else {
          // Move left if possible
          if (screenshot.gridColumnStart > 1) {
            const width = newP.gridColumnEnd - newP.gridColumnStart;
            newP.gridColumnEnd = screenshot.gridColumnStart;
            newP.gridColumnStart = Math.max(1, newP.gridColumnEnd - width);
          }
        }
        return newP;
      }
    }
    return p;
  });

  primitives.push(screenshot);

  return {
    ...layout,
    primitives,
  };
}

/**
 * Updates a primitive in the layout with new properties, ensuring it stays within bounds.
 * Clamps borderRadiusPx to allowed values if present.
 *
 * @param layout The current layout configuration.
 * @param primitiveId The ID of the primitive to update.
 * @param patch The properties to update.
 * @returns A new LayoutConfig with the primitive updated.
 */
export function updatePrimitive(
  layout: LayoutConfig,
  primitiveId: string,
  patch: Partial<LayoutPrimitive>,
): LayoutConfig {
  const ALLOWED_BORDER_RADIUS = [0, 8, 16, 24];

  const newPrimitives = layout.primitives.map((p) => {
    if (p.id !== primitiveId) return p;

    const updated = { ...p, ...patch } as LayoutPrimitive;

    // Clamp coordinates to grid bounds
    updated.gridColumnStart = Math.max(1, Math.min(layout.gridColumns, updated.gridColumnStart));
    updated.gridColumnEnd = Math.max(
      updated.gridColumnStart + 1,
      Math.min(layout.gridColumns + 1, updated.gridColumnEnd),
    );
    updated.gridRowStart = Math.max(1, Math.min(layout.gridRows, updated.gridRowStart));
    updated.gridRowEnd = Math.max(
      updated.gridRowStart + 1,
      Math.min(layout.gridRows + 1, updated.gridRowEnd),
    );

    // Clamp borderRadiusPx if it's a screenshot and the field is present in patch
    if (
      updated.type === "screenshot" &&
      "borderRadiusPx" in patch &&
      typeof patch.borderRadiusPx === "number"
    ) {
      const current = patch.borderRadiusPx;
      const closest = ALLOWED_BORDER_RADIUS.reduce((prev, curr) =>
        Math.abs(curr - current) < Math.abs(prev - current) ? curr : prev,
      );
      updated.borderRadiusPx = closest;
    }

    return updated;
  });

  return {
    ...layout,
    primitives: newPrimitives,
  };
}

/**
 * Detects overlaps between text blocks and screenshots and nudges text blocks to free space.
 * Best-effort deterministic algorithm: nudges away from screenshot center.
 *
 * @param layout The current layout configuration.
 * @returns A new LayoutConfig with overlaps resolved.
 */
export function ensureNoOverlap(layout: LayoutConfig): LayoutConfig {
  let primitives = [...layout.primitives];
  const screenshots = primitives.filter((p) => p.type === "screenshot") as ScreenshotPrimitive[];

  for (let i = 0; i < primitives.length; i++) {
    const p = primitives[i];
    if (p.type !== "textBlock") continue;

    let text = { ...p };
    let changed = false;

    for (const screenshot of screenshots) {
      if (
        rectsIntersect(
          text.gridColumnStart,
          text.gridColumnEnd,
          text.gridRowStart,
          text.gridRowEnd,
          screenshot.gridColumnStart,
          screenshot.gridColumnEnd,
          screenshot.gridRowStart,
          screenshot.gridRowEnd,
        )
      ) {
        // Overlap detected. Nudge text based on relative centers.
        const textCx = (text.gridColumnStart + text.gridColumnEnd) / 2;
        const textCy = (text.gridRowStart + text.gridRowEnd) / 2;
        const shotCx = (screenshot.gridColumnStart + screenshot.gridColumnEnd) / 2;
        const shotCy = (screenshot.gridRowStart + screenshot.gridRowEnd) / 2;

        const dx = textCx - shotCx;
        const dy = textCy - shotCy;

        const width = text.gridColumnEnd - text.gridColumnStart;
        const height = text.gridRowEnd - text.gridRowStart;

        // Prefer moving in the direction of the largest offset
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal move
          if (dx > 0) {
            // Move Right
            text.gridColumnStart = screenshot.gridColumnEnd;
            text.gridColumnEnd = text.gridColumnStart + width;
          } else {
            // Move Left
            text.gridColumnEnd = screenshot.gridColumnStart;
            text.gridColumnStart = text.gridColumnEnd - width;
          }
        } else {
          // Vertical move
          if (dy > 0) {
            // Move Down
            text.gridRowStart = screenshot.gridRowEnd;
            text.gridRowEnd = text.gridRowStart + height;
          } else {
            // Move Up
            text.gridRowEnd = screenshot.gridRowStart;
            text.gridRowStart = text.gridRowEnd - height;
          }
        }

        // Clamp to grid after move
        if (text.gridColumnStart < 1) {
          text.gridColumnStart = 1;
          text.gridColumnEnd = 1 + width;
        }
        if (text.gridColumnEnd > layout.gridColumns + 1) {
          text.gridColumnEnd = layout.gridColumns + 1;
          text.gridColumnStart = text.gridColumnEnd - width;
        }
        if (text.gridRowStart < 1) {
          text.gridRowStart = 1;
          text.gridRowEnd = 1 + height;
        }
        if (text.gridRowEnd > layout.gridRows + 1) {
          text.gridRowEnd = layout.gridRows + 1;
          text.gridRowStart = text.gridRowEnd - height;
        }

        changed = true;
      }
    }

    if (changed) {
      primitives[i] = text;
    }
  }

  return {
    ...layout,
    primitives,
  };
}

function rectsIntersect(
  c1s: number,
  c1e: number,
  r1s: number,
  r1e: number,
  c2s: number,
  c2e: number,
  r2s: number,
  r2e: number,
): boolean {
  if (c1s >= c2e || c2s >= c1e) return false;
  if (r1s >= r2e || r2s >= r1e) return false;
  return true;
}
