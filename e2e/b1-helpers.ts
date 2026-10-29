import { expect, type Page } from '@playwright/test';

/** Account buttons on /login. Names are the two fictional accounts. */
export const accountButton = {
  a: /Пекарня Нан|Айгуль С\./,
  b: /Мастерская Темир|Ерлан Б\./,
} as const;

export const ownerOnlyLine = 'Управление сайтом, видно только владельцу';
export const signInPrompt = 'Войдите, чтобы управлять сайтом';

/** Ink header on management screens, white header on the public site. */
export const inkHeader = 'rgb(35, 31, 32)';
export const publicHeader = 'rgb(255, 255, 255)';

const manageSuffixes = [
  '',
  '/upload',
  '/preview',
  '/versions',
  '/domain',
  '/plan',
] as const;

export function managePaths(slug: string): string[] {
  return manageSuffixes.map((suffix) => `/manage/${slug}${suffix}`);
}

export function readPath(page: Page): string {
  return new URL(page.url()).pathname;
}

export async function signIn(
  page: Page,
  account: keyof typeof accountButton,
): Promise<void> {
  await page.goto('/login');
  await page
    .getByRole('button', { name: accountButton[account] })
    .click({ timeout: 5_000 });
  // A later visit reloads the page, so wait until the session is saved.
  await page.waitForFunction(
    (accountId) => {
      const raw = sessionStorage.getItem('alertion.session');
      if (!raw) return false;
      try {
        const parsed: unknown = JSON.parse(raw);
        return (
          typeof parsed === 'object' &&
          parsed !== null &&
          'sessionAccountId' in parsed &&
          parsed.sessionAccountId === accountId
        );
      } catch {
        return false;
      }
    },
    account,
    { timeout: 5_000 },
  );
}

export async function expectTextAbsent(
  page: Page,
  text: string,
): Promise<void> {
  await expect(page.getByText(text)).toHaveCount(0);
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    await expect(frame.getByText(text)).toHaveCount(0);
  }
}

export async function expectAccountButtons(page: Page): Promise<void> {
  await expect(
    page.getByRole('button', { name: accountButton.a }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: accountButton.b }),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
}
