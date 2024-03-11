import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Read the blog' }).click();
  await page.getByRole('link', { name: '初めまして（ゆぴ） 2024年3月9日' }).click();
  await page.getByLabel('サービス一覧へ移動する').click();
  await page.getByLabel('利用規約ページへ移動する').click();
  await page.getByLabel('トップページへ移動する').click();
  await page.getByRole('button', { name: 'VIEW ALL' }).click();
});
