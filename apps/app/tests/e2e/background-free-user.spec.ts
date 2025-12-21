import { test, expect } from "@playwright/test";

test.describe("Free User Background Access (T028-T030 - User Story 3)", () => {
  const openBackgroundSection = async (page: any) => {
    const designTab = page.getByRole("tab", { name: "Design" });
    if (await designTab.isVisible()) {
      await designTab.click();
    }

    const trigger = page.getByRole("button", { name: "Background" });
    if (await trigger.isVisible()) {
      const expanded = await trigger.getAttribute("aria-expanded");
      if (expanded !== "true") {
        await trigger.click();
      }
    }
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("free user can access curated backgrounds (T028)", async ({ page }) => {
    await openBackgroundSection(page);

    // Should see curated backgrounds section
    const curatedSection = page.locator('[data-testid="curated-backgrounds-section"]');
    await expect(curatedSection).toBeVisible();

    // Should show at least 10 curated backgrounds
    const curatedBackgrounds = page.locator('[data-testid^="curated-background-"]');
    const count = await curatedBackgrounds.count();
    expect(count).toBeGreaterThanOrEqual(10);

    // Verify each background has a thumbnail
    for (let i = 0; i < Math.min(count, 10); i++) {
      const background = curatedBackgrounds.nth(i);
      await expect(background).toBeVisible();

      // Should have background image
      const backgroundImage = await background.evaluate((el) =>
        window.getComputedStyle(el).backgroundImage
      );
      expect(backgroundImage).not.toBe('none');
    }
  });

  test("free user can select curated backgrounds (T028)", async ({ page }) => {
    await openBackgroundSection(page);

    // Click on first curated background
    const firstCurated = page.locator('[data-testid^="curated-background-"]').first();
    await firstCurated.click();

    // Background should apply to canvas
    const canvas = page.locator('[data-testid="preview-canvas"]');
    const backgroundImage = await canvas.evaluate((el) =>
      window.getComputedStyle(el).backgroundImage
    );
    expect(backgroundImage).not.toBe('none');
    expect(backgroundImage).toContain('curated-backgrounds');
  });

  test("free user does not see user backgrounds section (T030)", async ({ page }) => {
    await openBackgroundSection(page);

    // User backgrounds section should not be visible
    await expect(page.locator('[data-testid="user-backgrounds-section"]')).not.toBeVisible();

    // Should not see upload option
    await expect(page.locator("#background-persistent-upload")).not.toBeVisible();
  });

  test("free user does not see brand sidebar upload option (T030)", async ({ page }) => {
    const brandTab = page.getByRole("tab", { name: "Brand" });
    if (await brandTab.isVisible()) {
      await brandTab.click();
      await expect(page.locator('[data-testid="background-upload-section"]')).not.toBeVisible();
    }
  });

  test("curated backgrounds collection handles empty state (T029)", async ({ page }) => {
    // This test verifies error handling if curated backgrounds fail to load
    // We can mock the API failure in a separate test

    // Intercept API call and make it fail
    await page.route('**/api/background/list', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await page.goto("/");
    await openBackgroundSection(page);

    // Should show error message
    await expect(page.locator('[data-testid="backgrounds-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="backgrounds-error"]')).toHaveText(
      /failed.*load.*backgrounds/i
    );
  });

  test("curated backgrounds collection handles no backgrounds available (T029)", async ({ page }) => {
    // Mock API returning empty curated backgrounds
    await page.route('**/api/background/list', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ user: [], curated: [] }),
      });
    });

    await page.goto("/");
    await openBackgroundSection(page);

    // Should show empty state
    await expect(page.locator('[data-testid="curated-backgrounds-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="curated-backgrounds-empty"]')).toHaveText(
      /no.*curated.*backgrounds/i
    );
  });

  test.skip('background selector loads within 1 second (T035)', async ({ page }) => {
    const startTime = Date.now();

    await page.click('[data-testid="background-selector-toggle"]');

    // Wait for curated backgrounds to appear
    await expect(page.locator('[data-testid^="curated-background-"]').first()).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load within 1 second (1000ms)
    expect(loadTime).toBeLessThan(1000);
  });

  test.skip('curated backgrounds show correct names', async ({ page }) => {
    await page.click('[data-testid="background-selector-toggle"]');

    // First curated background should have a name
    const firstCurated = page.locator('[data-testid^="curated-background-"]').first();
    await expect(firstCurated).toBeVisible();

    const name = await firstCurated.getAttribute('data-background-name');
    expect(name).toBeTruthy();
    expect(name).not.toBe('');
  });

  test.skip('curated backgrounds are publicly accessible', async ({ page }) => {
    await page.click('[data-testid="background-selector-toggle"]');

    // Get first curated background URL
    const firstCurated = page.locator('[data-testid^="curated-background-"]').first();
    const backgroundUrl = await firstCurated.evaluate((el) => {
      const bgImage = window.getComputedStyle(el).backgroundImage;
      const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/);
      return urlMatch ? urlMatch[1] : null;
    });

    expect(backgroundUrl).toBeTruthy();

    // URL should be public (no signed token)
    expect(backgroundUrl).toContain('curated-backgrounds');
    expect(backgroundUrl).toContain('public');
    expect(backgroundUrl).not.toContain('token=');
  });

  test.skip('analytics tracks curated background selection (T034)', async ({ page }) => {
    // Setup analytics tracking listener
    const analyticsEvents: any[] = [];
    await page.on('console', (msg) => {
      if (msg.text().includes('analytics:')) {
        analyticsEvents.push(msg.text());
      }
    });

    await page.click('[data-testid="background-selector-toggle"]');

    // Select curated background
    const firstCurated = page.locator('[data-testid^="curated-background-"]').first();
    await firstCurated.click();

    // Should track background_selected event with source: "curated"
    const hasEvent = analyticsEvents.some((event) =>
      event.includes('background_selected') && event.includes('curated')
    );
    expect(hasEvent).toBe(true);
  });
});
