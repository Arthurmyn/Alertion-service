import { expect, test } from '@playwright/test';
import {
  expectAccountButtons,
  expectTextAbsent,
  publicHeader,
  readPath,
  signIn,
  signInPrompt,
} from './support/b1-helpers.ts';

const accountAData = [
  'Пекарня Нан',
  'Айгуль С.',
  'Баурсак, 500 ₸',
  'nan-v1.zip',
  '12 МБ из 150 МБ',
] as const;

// Unsafe path and over-limit upload from G3 are upload checks (B2).
test('G3 signed-out access and account-ownership denial', async ({ page }) => {
  await test.step('signed-out visit to management opens login', async () => {
    await page.goto('/manage/nan/versions');
    await expect(page).toHaveURL(/\/login\?/);
    const versions = new URL(page.url());
    expect(versions.pathname).toBe('/login');
    expect(versions.searchParams.get('next')).toBe('/manage/nan/versions');
    await expect(page.getByText(signInPrompt)).toBeVisible();
    await expectAccountButtons(page);

    await page.goto('/manage/temir');
    await expect(page).toHaveURL(/\/login\?/);
    const temir = new URL(page.url());
    expect(temir.pathname).toBe('/login');
    expect(temir.searchParams.get('next')).toBe('/manage/temir');
    await expect(page.getByText(signInPrompt)).toBeVisible();
  });

  await test.step('signed-out visit to the public site stays public', async () => {
    await page.goto('/site/nan');
    await expect(page).toHaveURL(/\/site\/nan$/);
    expect(readPath(page)).toBe('/site/nan');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('banner')).toHaveCSS(
      'background-color',
      publicHeader,
    );
    await expect(page.getByRole('link', { name: 'Версии' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Домен' })).toHaveCount(0);
    const site = page.frameLocator('iframe[title="Страница сайта"]');
    await expect(site.getByText('Баурсак, 500 ₸')).toBeVisible();
    await expect(page.getByText(signInPrompt)).toHaveCount(0);
  });

  await test.step('account B is denied on account A', async () => {
    await signIn(page, 'b');
    await page.goto('/manage/nan');
    expect(readPath(page)).toBe('/manage/nan');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('a[href="/manage/temir"]').first()).toBeVisible();
    for (const text of accountAData) {
      await expectTextAbsent(page, text);
    }
  });
});
