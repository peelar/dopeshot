import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe("Background Persistence (T017, T037, T040)", () => {
  async function ensurePasswordMode(page: any) {
    await page.goto("/auth");
    const toggle = page.getByRole("button", { name: /use email & password instead/i });
    if (await toggle.isVisible()) {
      await toggle.click();
    }
  }

  async function signUp(page: any, email: string, password: string) {
    await ensurePasswordMode(page);
    const signUpLink = page.getByRole("button", { name: "Sign up" });
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
    }

    await page.fill("#auth-email", email);
    await page.fill("#auth-password", password);
    await page.fill("#auth-password-confirm", password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/account created successfully/i)).toBeVisible();
  }

  async function signIn(page: any, email: string, password: string) {
    await ensurePasswordMode(page);
    const signInLink = page.getByRole("button", { name: "Sign in" });
    if (await signInLink.isVisible()) {
      await signInLink.click();
    }

    await page.fill("#auth-email", email);
    await page.fill("#auth-password", password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/signed in successfully/i)).toBeVisible();
  }

  async function signOut(page: any) {
    await page.goto("/auth");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page.getByRole("button", { name: /use email & password instead/i })).toBeVisible();
  }

  async function signUpAndGoHome(page: any) {
    const email = `background-e2e-${Date.now()}@example.com`;
    const password = "Password123!";
    await signUp(page, email, password);
    await page.goto("/");
    return { email, password };
  }

  test("uploads background and persists across logout/login (T017)", async ({ page }) => {
    const email = `background-e2e-${Date.now()}@example.com`;
    const password = "Password123!";

    // Step 1: Sign up and authenticate
    await signUp(page, email, password);

    // Step 2: Open brand tab and upload background
    await page.goto("/");
    await page.getByRole("tab", { name: "Brand" }).click();
    const fixtureFile = path.join(__dirname, "../fixtures/screenshot-1280x720.png");
    const uploadInput = page.locator('[data-testid="background-upload-dropzone"] input[type="file"]');
    await uploadInput.setInputFiles(fixtureFile);

    // Step 3: Wait for upload to complete
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    // Step 4: Verify background appears in selector
    await page.getByRole("tab", { name: "Design" }).click();
    const uploadedBackground = page.locator('[data-testid^="user-background-"] button').first();
    await expect(uploadedBackground).toBeVisible();
    const backgroundName = await uploadedBackground.getAttribute("data-background-name");

    // Step 5: Select the uploaded background
    await uploadedBackground.click();
    await expect(page.locator('[data-testid="preview-canvas"]')).toHaveCSS(
      "background-image",
      /screenshot-1280x720/
    );

    // Step 6: Logout
    await signOut(page);

    // Step 7: Login again
    await signIn(page, email, password);

    // Step 8: Verify background persists in selector
    await page.goto("/");
    await page.getByRole("tab", { name: "Design" }).click();
    const persistedBackground = page.locator(`[data-background-name="${backgroundName}"]`);
    await expect(persistedBackground).toBeVisible();
  });

  test('allows uploading multiple backgrounds (T036)', async ({ page }) => {
    await signUpAndGoHome(page);

    const backgrounds = [
      path.join(__dirname, '../fixtures/screenshot-1280x720.png'),
      path.join(__dirname, '../fixtures/screenshot-720x1280.png'),
      path.join(__dirname, '../fixtures/screenshot-4k.png'),
    ];

    // Upload 3 backgrounds
    await page.getByRole("tab", { name: "Brand" }).click();
    const uploadInput = page.locator('[data-testid="background-upload-dropzone"] input[type="file"]');
    for (const bg of backgrounds) {
      await uploadInput.setInputFiles(bg);
      await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();
    }

    // Verify all 3 appear in selector
    await page.getByRole("tab", { name: "Design" }).click();
    const userBackgrounds = page.locator('[data-testid^="user-background-"]');
    await expect(userBackgrounds).toHaveCount(3);
  });

  test('allows switching between multiple backgrounds (T037)', async ({ page }) => {
    await signUpAndGoHome(page);

    // Upload 2 backgrounds
    const bg1 = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    const bg2 = path.join(__dirname, '../fixtures/screenshot-720x1280.png');

    await page.getByRole("tab", { name: "Brand" }).click();
    const uploadInput = page.locator('[data-testid="background-upload-dropzone"] input[type="file"]');
    await uploadInput.setInputFiles(bg1);
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    await uploadInput.setInputFiles(bg2);
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    // Switch to background 1
    await page.getByRole("tab", { name: "Design" }).click();
    await page.locator('[data-background-name="screenshot-1280x720.png"] button').click();
    await expect(page.locator('[data-testid="preview-canvas"]')).toHaveCSS(
      'background-image',
      /screenshot-1280x720/
    );

    // Switch to background 2
    await page.locator('[data-background-name="screenshot-720x1280.png"] button').click();
    await expect(page.locator('[data-testid="preview-canvas"]')).toHaveCSS(
      'background-image',
      /screenshot-720x1280/
    );
  });

  test('rejects duplicate filename uploads (T040)', async ({ page }) => {
    await signUpAndGoHome(page);

    const bg = path.join(__dirname, '../fixtures/screenshot-1280x720.png');

    // Upload background first time
    await page.getByRole("tab", { name: "Brand" }).click();
    const uploadInput = page.locator('[data-testid="background-upload-dropzone"] input[type="file"]');
    await uploadInput.setInputFiles(bg);
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    // Try to upload same filename again
    await uploadInput.setInputFiles(bg);

    // Should show error about duplicate filename
    await expect(page.locator('[data-testid="upload-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-error-message"]')).toHaveText(
      /already exists.*rename/i
    );

    // Verify still only one background in selector
    await page.getByRole("tab", { name: "Design" }).click();
    const userBackgrounds = page.locator('[data-testid^="user-background-"]');
    await expect(userBackgrounds).toHaveCount(1);
  });

  test.skip('deletes background with confirmation (User Story 2)', async ({ page }) => {
    await signUpAndGoHome(page);

    // Upload background
    const bg = path.join(__dirname, '../fixtures/screenshot-1280x720.png');
    await page.getByRole("tab", { name: "Brand" }).click();
    const uploadInput = page.locator('[data-testid="background-upload-dropzone"] input[type="file"]');
    await uploadInput.setInputFiles(bg);
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    // Open background selector
    await page.getByRole("tab", { name: "Design" }).click();
    const background = page.locator('[data-testid^="user-background-"] button').first();
    await expect(background).toBeVisible();

    // Click delete button
    await background.hover();
    await page.click('[data-testid="delete-background-button"]');

    // Confirmation dialog should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toHaveText(/delete.*background/i);

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Background should disappear
    await expect(background).not.toBeVisible();
    const userBackgrounds = page.locator('[data-testid^="user-background-"]');
    await expect(userBackgrounds).toHaveCount(0);
  });

  test.skip('shows empty state when no backgrounds uploaded', async ({ page }) => {
    await signUpAndGoHome(page);

    // Open background selector
    await page.getByRole("tab", { name: "Design" }).click();

    // Should show empty state for user backgrounds
    await expect(page.locator('[data-testid="user-backgrounds-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-backgrounds-empty"]')).toHaveText(
      /no.*backgrounds.*yet/i
    );

    // Should still show curated backgrounds
    const curatedBackgrounds = page.locator('[data-testid^="curated-background-"]');
    await expect(curatedBackgrounds.first()).toBeVisible();
  });
});
