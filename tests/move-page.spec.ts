import { test } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('http://localhost:3000/');
	await page.screenshot({ path: 'screenshots/top.png', fullPage: true });

	await page.getByRole('button', { name: 'Read the blog' }).click();
	await page.screenshot({ path: 'screenshots/blog.png', fullPage: true });

	await page
		.getByRole('link', { name: '初めまして（ゆぴ） 2024年3月9日' })
		.click();
	await page.screenshot({ path: 'screenshots/blog-yupix.png', fullPage: true });

	await page.getByLabel('サービス一覧へ移動する').click();
	await page.screenshot({ path: 'screenshots/services.png', fullPage: true });

	await page.getByLabel('利用規約ページへ移動する').click();
	await page.screenshot({ path: 'screenshots/tos.png', fullPage: true });

	await page.getByLabel('トップページへ移動する').click();

	await page.getByRole('button', { name: 'VIEW ALL' }).click();
});
