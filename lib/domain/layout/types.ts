// Layout primitive type discriminator
export type LayoutPrimitiveType = "screenshot" | "textBlock" | "background";

// Base properties shared by all layout primitives
// Grid coordinates are 1-based: gridColumnStart is inclusive, gridColumnEnd is exclusive
export type LayoutPrimitiveBase = {
  id: string; // Stable ID for references from LLM or UI
  type: LayoutPrimitiveType;
  // UI Control: Position is editable via inputs, but typically controlled by templates/LLM
  gridColumnStart: number; // Left boundary of the primitive on the grid (1-based inclusive)
  gridColumnEnd: number; // Right boundary of the primitive on the grid (1-based exclusive)
  gridRowStart: number; // Top boundary of the primitive on the grid (1-based inclusive)
  gridRowEnd: number; // Bottom boundary of the primitive on the grid (1-based exclusive)
  zIndex: number; // Stacking order, higher values appear on top (Not currently UI exposed)
};

// Screenshot primitive displays an uploaded screenshot asset
export type ScreenshotPrimitive = LayoutPrimitiveBase & {
  type: "screenshot";
  // UI Control: Asset picker
  assetId: string; // Reference to the Asset.id
  // UI Control: Select ("soft" | "hard" | "none")
  shadowStyle: "soft" | "hard" | "none"; // Shadow effect applied to the screenshot
  // UI Control: Select (0, 8, 16, 24)
  borderRadiusPx: number; // Corner radius in pixels
  // UI Control: Select ("bottomCut" | "full")
  cropStyle: "bottomCut" | "full"; // How the screenshot is cropped/fitted
};

// Text role determines semantic meaning and default styling
export type TextRole = "title" | "subtitle" | "body" | "badge";

// Text block primitive displays text content
export type TextBlockPrimitive = LayoutPrimitiveBase & {
  type: "textBlock";
  // UI Control: Select (determines semantics)
  role: TextRole; // Semantic role affecting default styling
  // UI Control: Text input
  text: string; // The text content to display
  // UI Control: Select
  horizontalAlign: "left" | "center" | "right"; // Horizontal text alignment within the grid cell
  // UI Control: Select
  verticalAlign: "top" | "middle" | "bottom"; // Vertical text alignment within the grid cell
  // UI Control: Select (Font family)
  fontId: string; // Reference to a font in the font system (will map later)
  // UI Control: Select (Tailwind-aligned weight tokens)
  fontWeightToken: "regular" | "medium" | "semibold" | "bold"; // Font weight variant
  // UI Control: Select (Tailwind-aligned size tokens)
  fontSizeToken: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"; // Font size scale token
  letterSpacingToken?: "tight" | "normal" | "wide"; // Optional letter spacing adjustment (Not currently UI exposed)
};

// Background variant determines how colors are applied
export type BackgroundVariant = "solid" | "gradientLinear" | "gradientRadial";

// Background primitive fills the grid area with color(s)
export type BackgroundPrimitive = LayoutPrimitiveBase & {
  type: "background";
  // UI Control: Select
  variant: BackgroundVariant; // How the background is rendered
  // UI Control: Select (Tailwind color token, e.g., "slate-900")
  colorPrimary: string; // Primary color as CSS color string (e.g., hex, rgb, named)
  // UI Control: Select (Tailwind color token)
  colorSecondary?: string; // Secondary color for gradients (required for gradient variants)
  // UI Control: Not exposed yet (defaults to 135)
  gradientAngleDeg?: number; // Angle in degrees for linear gradients (0-360)
};

// Union type for all layout primitives
export type LayoutPrimitive = ScreenshotPrimitive | TextBlockPrimitive | BackgroundPrimitive;

// Theme defines the color and font defaults for a layout
// These are typically set by the chosen Template and not individually tweaked in the simple UI.
export type LayoutTheme = {
  backgroundColor: string; // Default background color for the entire layout
  accentColor: string; // Accent color for highlights and emphasis
  textColor: string; // Default text color
  mutedTextColor: string; // Secondary text color for less prominent text
  screenshotFrameColor: string; // Color used for screenshot frames/borders
  defaultTitleFontId: string; // Default font ID for title text blocks
  defaultBodyFontId: string; // Default font ID for body text blocks
};

// Layout configuration defines the grid structure and all primitives
export type LayoutConfig = {
  id: string;
  gridColumns: number; // Number of columns in the grid (MVP: typically 12)
  gridRows: number; // Number of rows in the grid (MVP: e.g., 6)
  theme: LayoutTheme; // Color and font theme for this layout
  primitives: LayoutPrimitive[]; // All layout primitives positioned on the grid
};
