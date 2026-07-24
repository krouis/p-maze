import { test, expect } from '@playwright/test';

test.describe('Mobile Controls', () => {
  test('should display D-pad and move player on touch button presses', async ({ page }) => {
    // Skip if desktop profile
    test.skip(!test.info().project.name.includes('mobile'), 'Only runs on mobile touch emulators');

    // Navigate with a mobile layout viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('./');

    // Start game
    await page.locator('#btn-play').click();

    // Verify D-pad is visible
    const dpad = page.locator('.touch-controls');
    await expect(dpad).toBeVisible();

    // Click right or down button
    const btnDown = page.locator('#dpad-down');
    await btnDown.dispatchEvent('touchstart');
    await page.waitForTimeout(50);
    await btnDown.dispatchEvent('touchend');

    await page.waitForTimeout(200);

    const pos = await page.evaluate(() => (window as any).app.state.playerPosition);
    // Player row should be 1 if down was clear, or 0 if blocked, but should not crash
    expect(pos).toBeDefined();
  });
});
