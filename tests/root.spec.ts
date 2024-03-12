import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test.describe('Root Page', () => {
  test('Check Title', async ({ page }) => {
    await expect(page).toHaveTitle('AkariNext');
  });

  test('Landing Page Text', async ({ page }) => {
    const text = 'Let\'s have fun and play funny!';
    expect(text).toBeTruthy();
    await page.screenshot({ path: 'screenshots/landing.png', fullPage: false });
  });
});
