import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("Brand Sidebar Visual Regression (T049)", () => {
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

  test("brand sidebar renders background section consistently", async ({ page }) => {
    const email = `brand-visual-${Date.now()}@example.com`;
    const password = "Password123!";

    await signUp(page, email, password);
    await page.goto("/");
    await page.getByRole("tab", { name: "Brand" }).click();

    const fixtureFile = path.join(__dirname, "../fixtures/screenshot-1280x720.png");
    const uploadInput = page.locator('[data-testid="background-upload-dropzone"] input[type="file"]');
    await uploadInput.setInputFiles(fixtureFile);
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    const section = page.locator('[data-testid="background-upload-section"]');
    await expect(section).toHaveScreenshot("brand-sidebar-background-section.png");
  });
});
