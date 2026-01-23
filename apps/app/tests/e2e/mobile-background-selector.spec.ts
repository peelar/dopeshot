import { test, expect } from '@playwright/test';

test.describe('Mobile Background Selector Layout', () => {
  test.skip('background selector should be sticky at bottom above mobile menu', async ({ page }) => {
    // TODO: Update test to match current mobile UI structure
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find the gradient tiles in the sticky bottom container (not the one in the Design sheet)
    // The sticky container has position fixed
    // Mobile shows 4 gradients (3 linear + mesh) in a single row
    const gradientGrid = page.locator('[class*="fixed"][class*="bottom"] div.grid.grid-cols-4');
    await expect(gradientGrid).toBeVisible();

    // Find the Design button in mobile menu
    const designButton = page.getByRole('button', { name: /design/i }).last();
    await expect(designButton).toBeVisible();

    // Get bounding boxes
    const gradientBox = await gradientGrid.boundingBox();
    const designButtonBox = await designButton.boundingBox();

    expect(gradientBox).not.toBeNull();
    expect(designButtonBox).not.toBeNull();

    if (gradientBox && designButtonBox) {
      // The gradient grid should be above the Design button
      expect(gradientBox.y + gradientBox.height).toBeLessThanOrEqual(designButtonBox.y);

      // Check that both are near the bottom of the viewport
      // The gradient container is a single row (4 gradients)
      // It should be within the bottom 150px of viewport
      expect(gradientBox.y).toBeGreaterThan(667 - 150);

      console.log(`Gradient bottom: ${gradientBox.y + gradientBox.height}px`);
      console.log(`Design button top: ${designButtonBox.y}px`);
      console.log(`Gap: ${designButtonBox.y - (gradientBox.y + gradientBox.height)}px`);
    }
  });
});
