import { expect, test } from '@playwright/test';
import {
  accountButton,
  expectAccountButtons,
  expectTextAbsent,
  inkHeader,
  ownerOnlyLine,
  readPath,
  signIn,
  signInPrompt,
} from './support/b1-helpers.ts';

const accountAData = [
  'Пекарня Нан',
  'Айгуль С.',
  'Баурсак, 500 ₸',
  'nan-v1.zip',
] as const;

test('B1 task signed-in, signed-out and access-denied screens', async ({
  page,
  browser,
}) => {
  await test.step('signed-out screen is login without a password', async () => {
    await page.goto('/app/login');
    expect(readPath(page)).toBe('/login');
    await expectAccountButtons(page);

    await page.goto('/app');
    await expect(page).toHaveURL(/\/login$/);
    expect(readPath(page)).toBe('/login');
  });

  await test.step('signed-out management returns to login', async () => {
    await page.goto('/app/manage/nan');
    await expect(page).toHaveURL(/\/login\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe('/app/login');
    expect(url.searchParams.get('next')).toBe('/manage/nan');
    await expect(page.getByText(signInPrompt)).toBeVisible();
    await expectAccountButtons(page);
  });

  await test.step('signed-in screen is the owner management page', async () => {
    await page
      .getByRole('button', { name: accountButton.a })
      .click({ timeout: 5_000 });
    // The sign-in carried `next`, so the owner lands on the project they asked for.
    await expect(page).toHaveURL(/\/manage\/nan$/);
    expect(readPath(page)).toBe('/manage/nan');
    await expect(page.getByRole('banner')).toHaveCSS(
      'background-color',
      inkHeader,
    );
    await expect(page.getByText(ownerOnlyLine)).toBeVisible();
  });

  await test.step('access-denied screen keeps the address', async () => {
    const context = await browser.newContext();
    const other = await context.newPage();
    await signIn(other, 'b');
    await other.goto('/app/manage/nan');
    expect(readPath(other)).toBe('/manage/nan');
    await expect(other).not.toHaveURL(/\/login/);
    await expect(
      other.locator('a[href="/app/manage/temir"]').first(),
    ).toBeVisible();
    for (const text of accountAData) {
      await expectTextAbsent(other, text);
    }
    await context.close();
  });
});
