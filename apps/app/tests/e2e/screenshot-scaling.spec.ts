import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Screenshot Scaling and Zoom', () => {
  const SCREENSHOT_PATH = path.join(__dirname, '../fixtures/screenshot-4k.png');

  test('Backdrop layout constrains zoom slider and fills canvas', async ({ page }) => {
    await page.goto('/');

    // 1. Switch to Backdrop layout
    // The aria-label should be "Select Backdrop look"
    const backdropButton = page.getByRole('button', { name: 'Select Backdrop look' });
    await expect(backdropButton).toBeVisible();
    await backdropButton.click();
    await expect(backdropButton).toHaveAttribute('aria-pressed', 'true');

    // 2. Verify Zoom Slider Max is 1.5
    // The slider input has aria-label="Screenshot zoom"
    const zoomSlider = page.getByLabel('Screenshot zoom');
    await expect(zoomSlider).toBeVisible();
    
    // Check max attribute
    await expect(zoomSlider).toHaveAttribute('max', '1.5');

    // 3. Upload a large screenshot
    const fileChooserPromise = page.waitForEvent('filechooser');
    // Click the upload button (there might be multiple, pick the first visible one or specific one)
    await page.getByRole('button', { name: /upload/i }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(SCREENSHOT_PATH);

    // Wait for image to load
    const screenshotImage = page.locator('[data-element="screenshot"]').first();
    await expect(screenshotImage).toBeVisible();

    // 4. Verify Screenshot Dimensions
    // It should be filling the container (minus padding).
    // Instead of brittle pixel math, verify it takes up most of the viewport width.
    
    const dimensions = await screenshotImage.evaluate((img: HTMLImageElement) => {
        const imgRect = img.getBoundingClientRect();
        return {
            imgWidth: imgRect.width,
            viewportWidth: window.innerWidth,
        };
    });

    expect(dimensions).not.toBeNull();
    // Image should be at least 80% of viewport width (accounting for padding and sidebars)
    expect(dimensions!.imgWidth).toBeGreaterThan(dimensions!.viewportWidth * 0.8);
    
    // 5. Verify Zoom Out works
    // Set value to 0.5
    await zoomSlider.fill('0.5');
    // Trigger change event if fill doesn't do it automatically for range inputs in all browsers
    await zoomSlider.evaluate(e => e.dispatchEvent(new Event('change', { bubbles: true })));
    // Wait for transform to apply (use polling or wait for expectation)
    
    // Verify transform scale using the same locator
    await expect(async () => {
         const transform = await screenshotImage.evaluate((img: HTMLImageElement) => {
             return img.parentElement?.style.transform;
         });
         expect(transform).toContain('scale(0.5)');
    }).toPass();

    // 6. Verify Max Zoom is NOT constrained (can go to 1.5)
    await zoomSlider.fill('1.5');
    await zoomSlider.evaluate(e => e.dispatchEvent(new Event('change', { bubbles: true })));
    
     await expect(async () => {
         const transform = await screenshotImage.evaluate((img: HTMLImageElement) => {
             return img.parentElement?.style.transform;
         });
         expect(transform).toContain('scale(1.5)');
    }).toPass();
    
    // 7. Switch to another layout (e.g. Peak Right) and verify slider max is 1.5
    const peakRightButton = page.getByRole('button', { name: 'Select Peak Right look' });
    await peakRightButton.click();
    await expect(peakRightButton).toHaveAttribute('aria-pressed', 'true');
    
    await expect(zoomSlider).toHaveAttribute('max', '1.5');
  });
});

