import { expect, test } from '@playwright/test';
import {
  expectTextAbsent,
  inkHeader,
  ownerOnlyLine,
  publicHeader,
  readPath,
  signIn,
} from './support/b1-helpers.ts';

const nanPrivate = [
  'Пекарня Нан',
  'Айгуль С.',
  'Баурсак, 500 ₸',
  'nan-v1.zip',
] as const;

const temirPrivate = [
  'Мастерская Темир',
  'Ерлан Б.',
  'Заточка ножа, 2 000 ₸',
  'temir-v1.zip',
] as const;

test('B1 task ownership rules with two fictional accounts', async ({
  page,
  browser,
}) => {
  await test.step('account A is at home on nan', async () => {
    await signIn(page, 'a');
    await page.goto('/');
    await expect(page).toHaveURL(/\/manage\/nan$/);
    await expect(page.getByRole('banner')).toHaveCSS(
      'background-color',
      inkHeader,
    );
    await expect(page.getByText(ownerOnlyLine)).toBeVisible();

    await page.goto('/site/nan');
    await expect(page.getByRole('banner')).toHaveCSS(
      'background-color',
      publicHeader,
    );
    const nan = page.frameLocator('iframe[title="Страница сайта"]');
    await expect(
      nan.getByRole('heading', { name: 'Пекарня Нан' }),
    ).toBeVisible();
    await expect(nan.getByText('Баурсак, 500 ₸')).toBeVisible();
    await expectTextAbsent(page, 'Заточка ножа, 2 000 ₸');

    await page.goto('/manage/temir');
    expect(readPath(page)).toBe('/manage/temir');
    await expect(page.locator('a[href="/manage/nan"]').first()).toBeVisible();
    for (const text of temirPrivate) {
      await expectTextAbsent(page, text);
    }
  });

  await test.step('account B is at home on temir', async () => {
    const context = await browser.newContext();
    const other = await context.newPage();
    await signIn(other, 'b');
    await other.goto('/');
    await expect(other).toHaveURL(/\/manage\/temir$/);
    await expect(other.getByRole('banner')).toHaveCSS(
      'background-color',
      inkHeader,
    );
    await expect(other.getByText(ownerOnlyLine)).toBeVisible();

    await other.goto('/site/temir');
    await expect(other.getByRole('banner')).toHaveCSS(
      'background-color',
      publicHeader,
    );
    const temir = other.frameLocator('iframe[title="Страница сайта"]');
    await expect(
      temir.getByRole('heading', { name: 'Мастерская Темир' }),
    ).toBeVisible();
    await expect(temir.getByText('Заточка ножа, 2 000 ₸')).toBeVisible();
    await expectTextAbsent(other, 'Баурсак, 500 ₸');

    await other.goto('/manage/nan');
    expect(readPath(other)).toBe('/manage/nan');
    await expect(
      other.locator('a[href="/manage/temir"]').first(),
    ).toBeVisible();
    for (const text of nanPrivate) {
      await expectTextAbsent(other, text);
    }
    await context.close();
  });
});
