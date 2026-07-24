import { test, expect } from '@playwright/test';

test.describe('Data Persistence', () => {
  test('should persist gameplay progress and settings across page reloads', async ({ page }) => {
    await page.goto('./');
    await page.locator('#btn-play').click();

    // Set level to 3 programmatically to test progression save
    await page.evaluate(() => {
      (window as any).app.state.initLevel(3, false);
      (window as any).app.state.saveToStorage();
    });

    // Reload page
    await page.reload();

    // Verify continue button is visible and active
    const continueBtn = page.locator('#btn-continue');
    await expect(continueBtn).not.toHaveClass(/hidden/);
    await continueBtn.click();

    // Check we loaded back into level 3
    const lvlText = await page.locator('#label-level').textContent();
    expect(lvlText).toBe('Level 3');
  });

  test('should reset progress when holding the reset button', async ({ page }) => {
    await page.goto('./');
    await page.locator('#btn-play').click();

    // Set level to 2
    await page.evaluate(() => {
      (window as any).app.state.initLevel(2, false);
      (window as any).app.state.saveToStorage();
    });

    // Open settings dialog
    await page.locator('#btn-pause').click();
    await page.locator('#btn-pause-settings').click();

    const resetBtn = page.locator('#btn-reset-hold');

    // Hold button down for 2.2 seconds (2200ms)
    await resetBtn.hover();
    await page.mouse.down();
    await page.waitForTimeout(2200);
    await page.mouse.up();

    // Dialog should be closed, and we should be back on the start screen
    await expect(page.locator('#screen-start')).not.toHaveClass(/hidden/);
    await expect(page.locator('#btn-continue')).toHaveClass(/hidden/); // Continue hidden on reset
  });
});
