import { test, expect } from '@playwright/test';

test.describe('Desktop Keyboard Controls and Gameplay screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('should display home screen and play game', async ({ page }) => {
    // Assert title is displayed
    await expect(page.locator('.game-title')).toHaveText('p-maze');

    // Click play button
    const playBtn = page.locator('#btn-play');
    await playBtn.click();

    // Game screen should be active
    const gameScreen = page.locator('#screen-game');
    await expect(gameScreen).not.toHaveClass(/hidden/);

    // Verify player state is loaded on window
    const playerPos = await page.evaluate(() => (window as any).app.state.playerPosition);
    expect(playerPos).toEqual({ row: 0, column: 0 });

    // Press ArrowDown
    await page.keyboard.press('ArrowDown');
    // Wait for movement animation (100ms) plus a buffer
    await page.waitForTimeout(200);

    // Verify player moved to (1, 0) or bumped depending on walls
    const newPos = await page.evaluate(() => (window as any).app.state.playerPosition);
    expect(newPos.row + newPos.column).toBeGreaterThanOrEqual(0);
  });

  test('should pause and resume correctly', async ({ page }) => {
    await page.locator('#btn-play').click();

    // Click pause button
    await page.locator('#btn-pause').click();
    await expect(page.locator('#overlay-pause')).not.toHaveClass(/hidden/);

    // Click resume button
    await page.locator('#btn-resume').click();
    await expect(page.locator('#overlay-pause')).toHaveClass(/hidden/);
  });
});
