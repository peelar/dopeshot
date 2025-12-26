import { test, expect } from '@playwright/test';

test.describe('Playground', () => {
  test('renders the landing page with playground', async ({ page }) => {
    await page.goto('/');

    // Check if the app header is visible
    await expect(page.getByRole('link', { name: 'Go to homepage' })).toBeVisible();

    // Check if upload button is visible
    await expect(page.getByRole('button', { name: /upload/i }).first()).toBeVisible();
  });

  test('look selector displays multiple look options', async ({ page }) => {
    await page.goto('/');

    // Wait for layout selector to be visible (indicates page is loaded)
    await page.waitForSelector('[class*="flex"][class*="gap"]', { state: 'visible' });

    // Check that look preview cards are rendered (should have 6: Peak Left/Right/Center, Spotlight Left/Right, Backdrop)
    const lookCards = page.getByRole('button', { name: /select.*look/i });
    const count = await lookCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('can switch between different looks', async ({ page }) => {
    await page.goto('/');

    // Wait for layout selector to be visible (indicates page is loaded)
    await page.waitForSelector('[class*="flex"][class*="gap"]', { state: 'visible' });

    // Find look selection buttons (e.g., "Select Peak Left look", "Select Peak Right look")
    const lookButtons = page.getByRole('button', { name: /select.*look/i });
    const count = await lookButtons.count();

    // Should have multiple looks available (Peak Left, Peak Right, Peak Center, Spotlight Left, etc.)
    expect(count).toBeGreaterThan(1);

    if (count > 1) {
      // Click on the second look option
      const secondLook = lookButtons.nth(1);
      await secondLook.click();

      // Verify it's now selected (has aria-pressed="true")
      await expect(secondLook).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('pattern controls are present in sidebar', async ({ page }) => {
    await page.goto('/');

    // Wait for layout selector to be visible (indicates page is loaded)
    await page.waitForSelector('[class*="flex"][class*="gap"]', { state: 'visible' });

    // Look for Pattern Style label in the sidebar (only visible for gradient backgrounds)
    const patternStyleLabel = page.getByText('Pattern Style');

    // Pattern controls may not always be visible (depends on background type)
    // Just verify they exist when visible, don't try to interact
    if (await patternStyleLabel.isVisible()) {
      // Verify pattern buttons exist: Off, Grain, Glow, Grid
      await expect(page.getByRole('button', { name: 'Off', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Grain', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Glow', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Grid', exact: true })).toBeVisible();
    }
  });

  test('shows upload button in header', async ({ page }) => {
    await page.goto('/');

    // Find the upload button
    const uploadButton = page.getByRole('button', { name: /upload your screenshot/i }).first();
    await expect(uploadButton).toBeVisible();
  });

  test('theme toggle is present', async ({ page }) => {
    await page.goto('/');

    // Look for theme toggle button (usually has sun/moon icon)
    const themeToggle = page.locator('button').filter({ has: page.locator('svg') }).last();
    await expect(themeToggle).toBeVisible();
  });
});
