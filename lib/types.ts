// Core project entity
export type Project = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// Asset represents uploaded files (screenshots, logos, icons, backgrounds, etc.)
export type Asset = {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  url: string;
  kind: "screenshot" | "logo" | "icon" | "background" | "other";
  createdAt: string;
};

// Layout primitive type discriminator
export type LayoutPrimitiveType = "screenshot" | "textBlock" | "background";

// Base properties shared by all layout primitives
// Grid coordinates are 1-based: gridColumnStart is inclusive, gridColumnEnd is exclusive
export type LayoutPrimitiveBase = {
  id: string; // Stable ID for references from LLM or UI
  type: LayoutPrimitiveType;
  gridColumnStart: number; // Left boundary of the primitive on the grid (1-based inclusive)
  gridColumnEnd: number; // Right boundary of the primitive on the grid (1-based exclusive)
  gridRowStart: number; // Top boundary of the primitive on the grid (1-based inclusive)
  gridRowEnd: number; // Bottom boundary of the primitive on the grid (1-based exclusive)
  zIndex: number; // Stacking order, higher values appear on top
};

// Screenshot primitive displays an uploaded screenshot asset
export type ScreenshotPrimitive = LayoutPrimitiveBase & {
  type: "screenshot";
  assetId: string; // Reference to the Asset.id
  shadowStyle: "soft" | "hard" | "none"; // Shadow effect applied to the screenshot
  borderRadiusPx: number; // Corner radius in pixels
  cropStyle: "bottomCut" | "full"; // How the screenshot is cropped/fitted
};

// Text role determines semantic meaning and default styling
export type TextRole = "title" | "subtitle" | "body" | "badge";

// Text block primitive displays text content
export type TextBlockPrimitive = LayoutPrimitiveBase & {
  type: "textBlock";
  role: TextRole; // Semantic role affecting default styling
  text: string; // The text content to display
  horizontalAlign: "left" | "center" | "right"; // Horizontal text alignment within the grid cell
  verticalAlign: "top" | "middle" | "bottom"; // Vertical text alignment within the grid cell
  fontId: string; // Reference to a font in the font system (will map later)
  fontWeightToken: "regular" | "medium" | "semibold" | "bold"; // Font weight variant
  fontSizeToken: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"; // Font size scale token
  letterSpacingToken?: "tight" | "normal" | "wide"; // Optional letter spacing adjustment
};

// Background variant determines how colors are applied
export type BackgroundVariant = "solid" | "gradientLinear" | "gradientRadial";

// Background primitive fills the grid area with color(s)
export type BackgroundPrimitive = LayoutPrimitiveBase & {
  type: "background";
  variant: BackgroundVariant; // How the background is rendered
  colorPrimary: string; // Primary color as CSS color string (e.g., hex, rgb, named)
  colorSecondary?: string; // Secondary color for gradients (required for gradient variants)
  gradientAngleDeg?: number; // Angle in degrees for linear gradients (0-360)
};

// Union type for all layout primitives
export type LayoutPrimitive =
  | ScreenshotPrimitive
  | TextBlockPrimitive
  | BackgroundPrimitive;

// Theme defines the color and font defaults for a layout
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

// Composition represents a complete cover design with its layout configuration
export type Composition = {
  id: string;
  projectId: string; // Reference to the parent Project.id
  userId: string; // Reference to the owner user
  name: string; // User-friendly name for this composition
  layoutConfig: LayoutConfig; // Complete layout definition stored as JSON
  createdAt: string; // ISO timestamp of creation
  updatedAt: string; // ISO timestamp of last update
};
