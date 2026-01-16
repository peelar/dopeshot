import { test, expect } from "@playwright/test";

test.describe("Playground route", () => {
  test("renders playground in dev", async ({ page }) => {
    const response = await page.goto("/playground");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Background Playground" })).toBeVisible();
  });
});
