/**
 * Gradient Curation Domain
 *
 * Types, data, and utilities for the internal gradient curation wall.
 * This module supports the development-only gradient evaluation environment.
 */

export type {
  GradientSection,
  RejectionReason,
  CurationStatus,
  GradientTemplate,
  TestPalette,
} from "./types";

export {
  GRADIENT_TEMPLATES,
  getTemplatesBySection,
  getTemplateByIndex,
  SECTION_METADATA,
} from "./gradient-templates";

export { TEST_PALETTES, getPaletteById } from "./test-palettes";
