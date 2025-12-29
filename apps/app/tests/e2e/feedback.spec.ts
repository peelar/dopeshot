import { test, expect } from "@playwright/test";

test.describe("Feedback Feature", () => {
  test("feedback button is visible in header", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Feedback button should be visible
    const feedbackButton = page.getByRole("button", { name: /feedback/i });
    await expect(feedbackButton).toBeVisible();
  });

  test("clicking feedback button opens modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click feedback button
    const feedbackButton = page.getByRole("button", { name: /feedback/i });
    await feedbackButton.click();

    // Modal should open
    await expect(page.getByText("Share Your Feedback")).toBeVisible();
    await expect(
      page.getByText("Help us improve DopeShot for you")
    ).toBeVisible();
  });

  test("feedback modal displays form elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open feedback modal
    await page.getByRole("button", { name: /feedback/i }).click();

    // Check form elements
    await expect(
      page.getByLabel(
        /What are you trying to do, and what would make DopeShot better for you/i
      )
    ).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send Feedback/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();
  });

  test("can close feedback modal with cancel button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open feedback modal
    await page.getByRole("button", { name: /feedback/i }).click();
    await expect(page.getByText("Share Your Feedback")).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Modal should close
    await expect(page.getByText("Share Your Feedback")).not.toBeVisible();
  });

  test("submit button is disabled when feedback is empty", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open feedback modal
    await page.getByRole("button", { name: /feedback/i }).click();

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: /Send Feedback/i });
    await expect(submitButton).toBeDisabled();
  });

  test("can type feedback message", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open feedback modal
    await page.getByRole("button", { name: /feedback/i }).click();

    // Type feedback
    const textarea = page.getByLabel(
      /What are you trying to do, and what would make DopeShot better for you/i
    );
    await textarea.fill("This is my test feedback");

    // Textarea should have the value
    await expect(textarea).toHaveValue("This is my test feedback");

    // Submit button should be enabled
    const submitButton = page.getByRole("button", { name: /Send Feedback/i });
    await expect(submitButton).not.toBeDisabled();
  });

  test("can enter optional email", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open feedback modal
    await page.getByRole("button", { name: /feedback/i }).click();

    // Enter email
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill("test@example.com");

    // Email should have the value
    await expect(emailInput).toHaveValue("test@example.com");
  });

  test("submits feedback successfully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Mock the API response
    await page.route("**/api/feedback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, id: "test-id" }),
      });
    });

    // Open feedback modal
    await page.getByRole("button", { name: /feedback/i }).click();

    // Fill in feedback
    await page
      .getByLabel(
        /What are you trying to do, and what would make DopeShot better for you/i
      )
      .fill("Great app!");

    // Submit
    await page.getByRole("button", { name: /Send Feedback/i }).click();

    // Should show success message
    await expect(page.getByText("Thank you for your feedback!")).toBeVisible();

    // Modal should close after success
    await expect(page.getByText("Share Your Feedback")).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("handles submission errors gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Mock API error
    await page.route("**/api/feedback", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error occurred" }),
      });
    });

    // Open feedback modal
    await page.getByRole("button", { name: /feedback/i }).click();

    // Fill in feedback
    await page
      .getByLabel(
        /What are you trying to do, and what would make DopeShot better for you/i
      )
      .fill("Test error handling");

    // Submit
    await page.getByRole("button", { name: /Send Feedback/i }).click();

    // Should show error message
    await expect(page.getByText(/Server error occurred/i)).toBeVisible();

    // Modal should still be open
    await expect(page.getByText("Share Your Feedback")).toBeVisible();
  });

  test("feedback button is visible on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Feedback button should be visible on mobile
    const feedbackButton = page.getByRole("button", { name: /feedback/i });
    await expect(feedbackButton).toBeVisible();
  });

  test("can open and use feedback modal on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click feedback button
    await page.getByRole("button", { name: /feedback/i }).click();

    // Modal should open
    await expect(page.getByText("Share Your Feedback")).toBeVisible();

    // Can interact with form
    await page
      .getByLabel(
        /What are you trying to do, and what would make DopeShot better for you/i
      )
      .fill("Mobile feedback test");

    // Submit button should be enabled
    const submitButton = page.getByRole("button", { name: /Send Feedback/i });
    await expect(submitButton).not.toBeDisabled();
  });
});
