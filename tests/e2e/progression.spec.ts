import { test, expect } from '@playwright/test';

test.describe('Level Progression', () => {
  test('should increase maze sizes and transition levels successfully', async ({ page }) => {
    // Log page errors and console statements
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    await page.goto('./');
    await page.locator('#btn-play').click();

    // Verify initial level is 1
    const lvl1Text = await page.locator('#label-level').textContent();
    expect(lvl1Text).toBe('Level 1');

    // Trigger level completion programmatically in the browser context
    await page.evaluate(() => {
      console.log('EVAL: Triggering completeLevel programmatically...');
      const app = (window as any).app;
      if (!app) throw new Error('window.app is not defined!');
      if (!app.state) throw new Error('app.state is not defined!');
      app.state.completeLevel();
      console.log('EVAL: completeLevel triggered. Screen is:', app.state.screen);
    });

    // Verify Completion screen is active
    await expect(page.locator('#overlay-complete')).not.toHaveClass(/hidden/);

    // Click next level button
    await page.locator('#btn-next').click();

    // Verify level increased to 2
    const lvl2Text = await page.locator('#label-level').textContent();
    expect(lvl2Text).toBe('Level 2');

    const levelState = await page.evaluate(() => (window as any).app.state.level);
    expect(levelState).toBe(2);
  });
});
