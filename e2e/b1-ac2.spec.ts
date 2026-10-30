import { expect, test } from '@playwright/test';
import {
  expectTextAbsent,
  managePaths,
  readPath,
  signIn,
} from './support/b1-helpers.ts';

const accountAData = [
  'Пекарня Нан',
  'Айгуль С.',
  'Баурсак, 500 ₸',
  'nan-v1.zip',
  '12 МБ из 150 МБ',
] as const;

test('B1-AC2 account B is denied access to account A management screens', async ({
  page,
}) => {
  await signIn(page, 'b');

  for (const path of managePaths('nan')) {
    await page.goto(path);
    expect(readPath(page)).toBe(path);
    await expect(page).not.toHaveURL(/\/login/);

    const ownSite = page.locator('a[href="/manage/temir"]');
    await expect(ownSite.first()).toBeVisible();

    for (const text of accountAData) {
      await expectTextAbsent(page, text);
    }
  }
});
