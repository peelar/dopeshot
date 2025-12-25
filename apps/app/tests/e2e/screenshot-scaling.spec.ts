import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Screenshot Scaling and Zoom', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  const SCREENSHOT_PATH = path.join(__dirname, '../fixtures/screenshot-4k.png');

  test('Backdrop layout constrains zoom slider and fills canvas', async ({ page }) => {
    await page.goto('/');

    // 1. Upload large screenshot FIRST
    // We upload first because uploading might trigger an auto-layout recommendation
    // that switches us away from Backdrop. We want to be in Backdrop eventually.
    // Use the main file input which is a direct child of main
    const fileInput = page.locator('main > input[type="file"]');
    await fileInput.setInputFiles(SCREENSHOT_PATH);
    
    // Wait for image to load
    const screenshotImage = page.locator('[data-element="screenshot"]').first();
    await expect(screenshotImage).toBeVisible();

    // 2. Switch to Backdrop layout
    // The aria-label should be "Select Backdrop look"
    const backdropButton = page.getByRole('button', { name: 'Select Backdrop look' });
    await expect(backdropButton).toBeVisible();
    await backdropButton.click();
    await expect(backdropButton).toHaveAttribute('aria-pressed', 'true');

    // 3. Verify Zoom Slider Max is 1.0
    const zoomSlider = page.getByLabel('Screenshot zoom');
    await expect(zoomSlider).toBeVisible();
    await expect(zoomSlider).toHaveAttribute('max', '1');

    // 4. Verify Screenshot Dimensions
    // It should be filling the container (minus padding).
    // Verify it takes up most of the viewport width.
    
    const dimensions = await screenshotImage.evaluate((img: HTMLImageElement) => {
        const imgRect = img.getBoundingClientRect();
        return {
            imgWidth: imgRect.width,
            viewportWidth: window.innerWidth,
        };
    });

    expect(dimensions).not.toBeNull();
    // Image should be at least 80% of viewport width (accounting for padding and sidebars)
    // In Backdrop mode with 4K image, it should take up most of the available space.
    expect(dimensions!.imgWidth).toBeGreaterThan(dimensions!.viewportWidth * 0.8);
    
    // 5. Verify Zoom Out works
    // Set value to 0.5
    await zoomSlider.fill('0.5');
    // Trigger change event
    await zoomSlider.evaluate(e => e.dispatchEvent(new Event('change', { bubbles: true })));
    
    // Verify transform scale
    await expect(async () => {
         const transform = await screenshotImage.evaluate((img: HTMLImageElement) => {
             return img.parentElement?.style.transform;
         });
         expect(transform).toContain('scale(0.5)');
    }).toPass();

    // 6. Verify Max Zoom is constrained (can go to 1.0)
    await zoomSlider.fill('1.0');
    await zoomSlider.evaluate(e => e.dispatchEvent(new Event('change', { bubbles: true })));
    
     await expect(async () => {
         const transform = await screenshotImage.evaluate((img: HTMLImageElement) => {
             return img.parentElement?.style.transform;
         });
         expect(transform).toContain('scale(1)'); // 1 or 1.0
    }).toPass();
  });
});
