import { test, expect } from '@playwright/test';

test.describe('Accessibility features', () => {
  test('should toggle high-contrast and reduced-motion states correctly', async ({ page }) => {
    await page.goto('./');

    // Open settings dialog
    await page.locator('#btn-start-settings').click();
    await expect(page.locator('#dialog-settings')).toBeVisible();

    // Toggle reduced-motion checkbox
    const motionLbl = page.locator('label:has(#chk-motion)');
    await motionLbl.click();

    // Body should have reduced-motion-mode class
    await expect(page.locator('body')).toHaveClass(/reduced-motion-mode/);

    // Toggle high contrast checkbox
    const contrastLbl = page.locator('label:has(#chk-contrast)');
    await contrastLbl.click();

    // Body should have high-contrast-mode class
    await expect(page.locator('body')).toHaveClass(/high-contrast-mode/);
  });
});
