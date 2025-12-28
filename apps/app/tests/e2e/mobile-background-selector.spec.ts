import { test, expect } from '@playwright/test';

test.describe('Mobile Background Selector Layout', () => {
  test('background selector should be close to slider on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find the slider
    const slider = page.locator('input[type="range"][aria-label="Screenshot zoom"]');
    await expect(slider).toBeVisible();

    // Find the gradient tiles (should be in a grid)
    const gradientGrid = page.locator('div.grid.grid-cols-4');
    await expect(gradientGrid).toBeVisible();

    // Get bounding boxes
    const sliderBox = await slider.boundingBox();
    const gradientBox = await gradientGrid.boundingBox();

    expect(sliderBox).not.toBeNull();
    expect(gradientBox).not.toBeNull();

    if (sliderBox && gradientBox) {
      // Calculate the gap between slider bottom and gradient top
      const gap = gradientBox.y - (sliderBox.y + sliderBox.height);

      console.log(`Spacing between slider and gradients: ${gap}px`);
      console.log(`Slider bottom: ${sliderBox.y + sliderBox.height}px`);
      console.log(`Gradient top: ${gradientBox.y}px`);

      // Gap should be very small (less than 16px)
      expect(gap).toBeLessThan(16);
      expect(gap).toBeGreaterThanOrEqual(0);
    }
  });
});
