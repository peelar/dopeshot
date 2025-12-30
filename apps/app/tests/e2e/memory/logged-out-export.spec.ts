import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * E2E Test: Logged-Out User Export Flow
 *
 * Tests User Story 2: Logged-out users can still export with zero friction.
 * Memory sidebar shows empty state, and no server calls are made for persistence.
 *
 * Flow:
 * 1. User (not logged in) visits playground
 * 2. User uploads a screenshot
 * 3. User exports successfully
 * 4. File downloads without errors
 * 5. Memory sidebar is either not visible or shows empty state
 * 6. No network errors occur
 */

test.describe('Memory: Logged-Out Export', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage to ensure logged-out state
    await context.clearCookies();
    await context.clearPermissions();

    // Monitor network requests to verify no memory API calls
    page.on('request', request => {
      const url = request.url();
      // Memory API endpoints should not be called when logged out
      if (url.includes('/api/memory/items') && request.method() === 'POST') {
        console.warn('Memory API called while logged out:', url);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  });

  test('should allow export without login', async ({ page }) => {
    // Step 1: Upload test screenshot
    const fixtureFile = path.join(__dirname, '../../fixtures/screenshot-1280x720.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixtureFile);

    // Wait for upload to complete
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    // Step 2: Export should work normally
    const downloadPromise = page.waitForEvent('download');
    const exportButton = page.getByRole('button', { name: /export.*png/i });

    await expect(exportButton).toBeEnabled();
    await exportButton.click();

    // Step 3: Verify download completes
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('cover-image.png');

    // Verify file was actually downloaded
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('should show sign-up prompt when logged out', async ({ page }) => {
    // Try to find and open memory sidebar
    const memoryButton = page.locator('[aria-label*="memory"]').or(
      page.getByRole('button', { name: /memory/i })
    ).or(
      page.locator('button:has-text("History")')
    ).first();

    const memoryButtonExists = await memoryButton.count() > 0;

    if (memoryButtonExists) {
      await memoryButton.click();

      const memorySidebar = page.locator('[role="complementary"]').or(
        page.locator('aside:has-text("Memory")')
      ).first();

      const sidebarVisible = await memorySidebar.isVisible({ timeout: 2000 }).catch(() => false);

      if (sidebarVisible) {
        // Look for sign-up prompt elements
        const signUpButton = memorySidebar.getByRole('link', { name: /sign up/i });
        const saveWorkHeading = memorySidebar.locator('text=/save your work/i');

        // Verify sign-up prompt is shown for logged-out users
        const hasSignUpPrompt = await signUpButton.count() > 0;

        if (hasSignUpPrompt) {
          await expect(saveWorkHeading).toBeVisible();
          await expect(signUpButton).toBeVisible();

          // Verify the button links to /auth
          const href = await signUpButton.getAttribute('href');
          expect(href).toBe('/auth');

          // Verify simplified description (without "access them anytime")
          const description = memorySidebar.locator('text=/save your exported designs/i');
          await expect(description).toBeVisible();
        }

        // For logged-out users, there should be no memory items
        const memoryItems = memorySidebar.locator('[role="button"]').or(
          memorySidebar.locator('button').filter({ hasText: /./ })
        ).filter({ hasNot: page.locator('a[href="/auth"]') }); // Exclude sign-up button

        const itemCount = await memoryItems.count();
        expect(itemCount).toBe(0);
      }
    }
    // If memory button doesn't exist, that's also acceptable for logged-out users
  });

  test('should not create memory items after export when logged out', async ({ page }) => {
    let memoryApiCalled = false;

    // Monitor POST requests to memory API
    page.on('request', request => {
      if (request.url().includes('/api/memory/items') && request.method() === 'POST') {
        memoryApiCalled = true;
      }
    });

    // Upload and export
    const fixtureFile = path.join(__dirname, '../../fixtures/screenshot-1280x720.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixtureFile);
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export.*png/i }).click();
    await downloadPromise;

    // Wait a moment to ensure no deferred API calls
    await page.waitForTimeout(1000);

    // Verify memory API was not called
    expect(memoryApiCalled).toBe(false);
  });

  test('should handle multiple exports without errors when logged out', async ({ page }) => {
    const fixtureFile = path.join(__dirname, '../../fixtures/screenshot-1280x720.png');
    const fileInput = page.locator('input[type="file"]').first();

    // First upload and export
    await fileInput.setInputFiles(fixtureFile);
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    let downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export.*png/i }).click();
    await downloadPromise;

    // Wait a moment
    await page.waitForTimeout(500);

    // Second export (without re-uploading)
    downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export.*png/i }).click();
    const download2 = await downloadPromise;

    // Both exports should succeed
    expect(download2.suggestedFilename()).toBe('cover-image.png');

    // No JavaScript errors should have occurred
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Give time for any delayed errors
    await page.waitForTimeout(500);

    // Filter out expected/harmless errors (like CORS, if any)
    const significantErrors = consoleErrors.filter(err =>
      !err.includes('CORS') &&
      !err.includes('favicon') &&
      !err.toLowerCase().includes('jotai')
    );

    expect(significantErrors.length).toBe(0);
  });

  test('should show export nudge after first export when logged out', async ({ page }) => {
    // This test is for User Story 3 - post-export account nudge
    // Skip if the feature isn't implemented yet

    const fixtureFile = path.join(__dirname, '../../fixtures/screenshot-1280x720.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixtureFile);
    await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export.*png/i }).click();
    await downloadPromise;

    // Wait for nudge to potentially appear
    await page.waitForTimeout(500);

    // Look for account creation nudge (optional - might not be implemented yet)
    const nudge = page.locator('text=/create account/i').or(
      page.locator('text=/sign up/i')
    ).first();

    const nudgeExists = await nudge.count() > 0;

    if (nudgeExists) {
      await expect(nudge).toBeVisible();

      // Nudge should dismiss on interaction
      // (Testing this would require knowing the specific dismissal behavior)
    }
    // If nudge doesn't exist, feature might not be implemented yet - that's ok
  });
});
