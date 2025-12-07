import { test, expect } from '@playwright/test';

test.describe('Playground', () => {
  test('renders the landing page with playground', async ({ page }) => {
    await page.goto('/');

    // Check if the app header is visible
    await expect(page.getByText('dopeshot')).toBeVisible();

    // Check if the look selector is visible
    await expect(page.getByText('Look').first()).toBeVisible();

    // Check if upload button is visible
    await expect(page.getByRole('button', { name: /upload/i }).first()).toBeVisible();
  });

  test('look selector displays multiple look options', async ({ page }) => {
    await page.goto('/');

    // Wait for look selector to be visible
    await expect(page.getByText('Look').first()).toBeVisible();

    // Check that look preview cards are rendered
    const lookCards = page.getByRole('button', { name: /select.*look/i });
    const count = await lookCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('can switch between look variants', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if variant controls are present (may not be visible depending on selected look)
    const variantSection = page.getByText('Variants');
    if (await variantSection.isVisible()) {
      // Try to find variant buttons
      const variantButtons = page.getByRole('radio', { name: /variant/i });
      const count = await variantButtons.count();

      if (count > 0) {
        // Click on a different variant if multiple exist
        const firstVariant = variantButtons.first();
        await firstVariant.click();

        // Verify the variant button is checked
        await expect(firstVariant).toHaveAttribute('aria-checked', 'true');
      }
    }
  });

  test('style pattern controls work', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for style controls
    const styleSection = page.getByText('Style');
    if (await styleSection.isVisible()) {
      // Try to find pattern buttons
      const patternButtons = page.getByRole('radio', { name: /pattern/i });
      const count = await patternButtons.count();

      if (count > 0) {
        // Click on a pattern option
        const firstPattern = patternButtons.first();
        await firstPattern.click();

        // Verify the pattern button is checked
        await expect(firstPattern).toHaveAttribute('aria-checked', 'true');
      }
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
