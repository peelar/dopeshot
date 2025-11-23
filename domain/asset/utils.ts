import { Composition } from "../composition/types";
import { Asset } from "./types";
import { ScreenshotPrimitive } from "../layout/types";

/**
 * Checks if a composition has a valid screenshot.
 * A composition has a screenshot if:
 * 1. Its layoutConfig contains a screenshot primitive
 * 2. That primitive has an assetId
 * 3. An asset with that ID exists in the assets array with kind="screenshot"
 */
export function hasScreenshot(composition: Composition, assets: Asset[]): boolean {
  const screenshotPrimitive = composition.layoutConfig.primitives.find(
    (p) => p.type === "screenshot",
  ) as ScreenshotPrimitive | undefined;

  if (!screenshotPrimitive || !screenshotPrimitive.assetId) {
    return false;
  }

  const asset = assets.find(
    (a) => a.id === screenshotPrimitive.assetId && a.kind === "screenshot",
  );

  return !!asset;
}

/**
 * Gets the screenshot asset for a composition, if it exists.
 */
export function getScreenshotAsset(
  composition: Composition,
  assets: Asset[],
): Asset | undefined {
  const screenshotPrimitive = composition.layoutConfig.primitives.find(
    (p) => p.type === "screenshot",
  ) as ScreenshotPrimitive | undefined;

  if (!screenshotPrimitive || !screenshotPrimitive.assetId) {
    return undefined;
  }

  return assets.find(
    (a) => a.id === screenshotPrimitive.assetId && a.kind === "screenshot",
  );
}

