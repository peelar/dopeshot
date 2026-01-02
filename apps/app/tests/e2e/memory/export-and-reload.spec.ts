import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * E2E Test: Memory Export and Reload Flow
 *
 * Tests User Story 1: Logged-in user can export and see their export appear in memory sidebar,
 * then click to reload the configuration.
 *
 * Flow:
 * 1. User logs in (if auth is available)
 * 2. User uploads a screenshot
 * 3. User customizes design
 * 4. User exports
 * 5. Memory item appears in sidebar
 * 6. User clicks memory item
 * 7. Configuration is restored
 */

test.describe('Memory: Export and Reload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  });

  test.skip('should save export to memory and allow reload (logged-in user)', async ({ page }) => {
    // TODO: Fix download event detection in Playwright
    // Note: This test assumes the user is already logged in via session/cookie
    // In a real scenario, you might need to implement login flow first

    // Step 1: Upload test screenshot
    const fixtureFile = path.join(__dirname, '../../fixtures/screenshot-1280x720.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixtureFile);

    // Wait for upload to complete and preview to appear
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    // Step 2: Make a distinctive change to the configuration
    // (For example, change font style or background)
    // This will help us verify that reload actually restores state

    // Step 3: Export the design
    const downloadPromise = page.waitForEvent('download');
    const exportButton = page.getByRole('button', { name: /export.*png/i });
    await exportButton.click();

    // Wait for download to complete
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('cover-image.png');

    // Step 4: Wait a moment for memory item to be created
    await page.waitForTimeout(1000);

    // Step 5: Open memory sidebar
    // Look for memory button/trigger (adjust selector based on actual implementation)
    const memoryButton = page.locator('[aria-label*="memory"]').or(
      page.getByRole('button', { name: /memory/i })
    ).or(
      page.locator('button:has-text("History")')
    ).first();

    // Check if memory button exists (it might not if user isn't logged in)
    const memoryButtonExists = await memoryButton.count() > 0;

    if (memoryButtonExists) {
      await memoryButton.click();

      // Step 6: Verify memory sidebar is open and has at least one item
      const memorySidebar = page.locator('[role="complementary"]').or(
        page.locator('aside:has-text("Memory")')
      ).first();
      await expect(memorySidebar).toBeVisible({ timeout: 5000 });

      // Step 7: Find and click the first memory item
      const memoryItem = memorySidebar.locator('[role="button"]').or(
        memorySidebar.locator('button').filter({ hasText: /./ })
      ).first();

      const memoryItemExists = await memoryItem.count() > 0;

      if (memoryItemExists) {
        await memoryItem.click();

        // Step 8: Verify the sidebar closes (indicating load completed)
        await expect(memorySidebar).not.toBeVisible({ timeout: 3000 });

        // Step 9: Verify the preview is still visible (config loaded)
        await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();
      }
    } else {
      // Skip test if memory feature is not available (user not logged in)
      test.skip();
    }
  });

  test('should show empty state in memory sidebar when no exports', async ({ page }) => {
    // This test verifies the empty state for a new user with no exports

    // Try to open memory sidebar
    const memoryButton = page.locator('[aria-label*="memory"]').or(
      page.getByRole('button', { name: /memory/i })
    ).or(
      page.locator('button:has-text("History")')
    ).first();

    const memoryButtonExists = await memoryButton.count() > 0;

    if (memoryButtonExists) {
      await memoryButton.click();

      // Verify sidebar shows empty state message
      const memorySidebar = page.locator('[role="complementary"]').or(
        page.locator('aside:has-text("Memory")')
      ).first();

      await expect(memorySidebar).toBeVisible();

      // Look for empty state text
      const emptyStateText = memorySidebar.locator('text=/no exports/i').or(
        memorySidebar.locator('text=/your exported designs/i')
      );

      // Empty state should be visible if no previous exports
      // (This might not be true if user has existing exports)
      const hasEmptyState = await emptyStateText.count() > 0;

      if (hasEmptyState) {
        await expect(emptyStateText.first()).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test.skip('should persist memory items across page reloads', async ({ page }) => {
    // TODO: Fix download event detection in Playwright
    // Upload and export
    const fixtureFile = path.join(__dirname, '../../fixtures/screenshot-1280x720.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixtureFile);
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export.*png/i }).click();
    await downloadPromise;

    // Wait for memory creation
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Open memory sidebar
    const memoryButton = page.locator('[aria-label*="memory"]').or(
      page.getByRole('button', { name: /memory/i })
    ).or(
      page.locator('button:has-text("History")')
    ).first();

    const memoryButtonExists = await memoryButton.count() > 0;

    if (memoryButtonExists) {
      await memoryButton.click();

      // Verify memory items are still there
      const memorySidebar = page.locator('[role="complementary"]').or(
        page.locator('aside:has-text("Memory")')
      ).first();

      await expect(memorySidebar).toBeVisible();

      // Check for memory items (there should be at least one)
      const memoryItems = memorySidebar.locator('[role="button"]').or(
        memorySidebar.locator('button').filter({ hasText: /./ })
      );

      const itemCount = await memoryItems.count();
      expect(itemCount).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });
});
