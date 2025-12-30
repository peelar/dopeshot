import { test, expect } from '@playwright/test';

test.describe('Google OAuth Authentication', () => {
  test('renders Google sign-in button on auth page', async ({ page }) => {
    await page.goto('/auth');

    // Check if the Google sign-in button is visible
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
  });

  test('Google button displays the correct branding', async ({ page }) => {
    await page.goto('/auth');

    const googleButton = page.getByRole('button', { name: /continue with google/i });

    // Verify the button text
    await expect(googleButton).toContainText('Continue with Google');

    // Verify Google logo is present (svg element)
    const svg = googleButton.locator('svg').first();
    await expect(svg).toBeVisible();
  });

  test('shows divider between Google and magic link options', async ({ page }) => {
    await page.goto('/auth');

    // Check for the "or" divider
    const divider = page.getByText(/^or$/i);
    await expect(divider).toBeVisible();
  });

  test('displays magic link form below Google button', async ({ page }) => {
    await page.goto('/auth');

    // Verify magic link form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();
  });

  test('displays email & password toggle below magic link', async ({ page }) => {
    await page.goto('/auth');

    // Verify toggle link is present
    const toggleLink = page.getByRole('button', { name: /use email & password instead/i });
    await expect(toggleLink).toBeVisible();
  });

  test('can toggle between magic link and email/password modes', async ({ page }) => {
    await page.goto('/auth');

    // Click the toggle to switch to email/password mode
    const toggleLink = page.getByRole('button', { name: /use email & password instead/i });
    await toggleLink.click();

    // Verify password fields appear
    await expect(page.getByLabel(/^password$/i)).toBeVisible();

    // Verify we can toggle back
    const toggleBackLink = page.getByRole('button', { name: /send me a magic link/i });
    await expect(toggleBackLink).toBeVisible();
  });

  test('Google button remains visible in all auth modes', async ({ page }) => {
    await page.goto('/auth');

    // Google button should be visible initially
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();

    // Toggle to email/password mode
    const toggleLink = page.getByRole('button', { name: /use email & password instead/i });
    await toggleLink.click();

    // Google button should still be visible
    await expect(googleButton).toBeVisible();

    // Toggle back to magic link
    const toggleBackLink = page.getByRole('button', { name: /send me a magic link/i });
    await toggleBackLink.click();

    // Google button should still be visible
    await expect(googleButton).toBeVisible();
  });

  test('auth page displays correct heading and subheading', async ({ page }) => {
    await page.goto('/auth');

    // Check for heading
    await expect(page.getByRole('heading', { name: /sign in to dopeshot/i })).toBeVisible();

    // Check for subheading mentioning magic link
    await expect(page.getByText(/we'll send you a magic link/i)).toBeVisible();
  });

  test('displays dopeshot logo on auth page', async ({ page }) => {
    await page.goto('/auth');

    // Verify the logo/branding is present (svg element)
    const logo = page.locator('svg').first();
    await expect(logo).toBeVisible();
  });
});
