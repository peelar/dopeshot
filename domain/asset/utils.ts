import { LayoutConfig } from "../layout/types";
import { Asset } from "./types";

/**
 * Checks if a layout config has a valid screenshot.
 * A layout has a screenshot if:
 * 1. Its assets object has a screenshot property
 * 2. That property has an assetId
 * 3. An asset with that ID exists in the assets array with kind="screenshot"
 */
export function hasScreenshot(config: LayoutConfig, assets: Asset[]): boolean {
  if (!config.assets.screenshot) {
    return false;
  }

  const asset = assets.find(
    (a) => a.id === config.assets.screenshot && a.kind === "screenshot",
  );

  return !!asset;
}

/**
 * Gets the screenshot asset for a layout config, if it exists.
 */
export function getScreenshotAsset(config: LayoutConfig, assets: Asset[]): Asset | undefined {
  if (!config.assets.screenshot) {
    return undefined;
  }

  return assets.find((a) => a.id === config.assets.screenshot && a.kind === "screenshot");
}
