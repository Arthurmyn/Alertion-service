import { expect, type Page } from '@playwright/test';
import { accounts } from '../../src/data/accounts.ts';
import { archives } from '../../src/data/archives.ts';
import { sampleSites } from '../../src/data/sampleSites.ts';

function ownerAccount() {
  const found = accounts.find((account) => account.slug === 'nan');
  if (!found) throw new Error('missing account nan');
  return found;
}

const owner = ownerAccount();

function versionLabel(fileName: string): string {
  const label = archives[fileName]?.label;
  if (!label) throw new Error(`${fileName} has no version label`);
  return label;
}

function menuLines(html: string | undefined): string[] {
  if (!html) return [];
  return [...html.matchAll(/<li>([^<]+)<\/li>/g)].map(
    (match) => match[1] ?? '',
  );
}

const activeFile = 'nan-v1.zip';
const candidateFile = 'nan-v2.zip';

const activeLabel = versionLabel(activeFile);
export const candidateLabel = versionLabel(candidateFile);
const publishButtonName = `Опубликовать версию ${candidateLabel}`;

export const activeMenu = menuLines(sampleSites[activeFile]);
export const candidateMenu = menuLines(sampleSites[candidateFile]);
export const candidateOnly = candidateMenu.filter(
  (item) => !activeMenu.includes(item),
);

if (activeMenu.length === 0 || candidateOnly.length === 0) {
  throw new Error(
    'sample pages do not separate the active version from the candidate',
  );
}

export const previewAudience =
  'Предпросмотр видите только вы, пока выполнен вход в аккаунт этого сайта. Посетители и другие аккаунты видят активную версию.';

function activeStatus(label: string): string {
  return `Активна версия ${label}`;
}

function publishFailed(label: string): string {
  return `Публикация не прошла. Активная версия: ${label}.`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function signInAsOwner(page: Page): Promise<void> {
  await page.goto(`/manage/${owner.slug}/preview`);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Войдите, чтобы управлять сайтом')).toBeVisible();
  await page
    .getByRole('button', {
      name: new RegExp(
        `${escapeRegExp(owner.businessName)}|${escapeRegExp(owner.ownerName)}`,
      ),
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`/manage/${owner.slug}`));
}

export async function openScenario(page: Page, id: string): Promise<void> {
  await page.goto(`/?scenario=${encodeURIComponent(id)}`);
  await expect(page).not.toHaveURL(/[?&]scenario=/);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

export async function expectNoCandidatePreview(page: Page): Promise<void> {
  await page.goto(`/manage/${owner.slug}/preview`);
  const upload = page.locator(`main a[href="/manage/${owner.slug}/upload"]`);
  await expect(upload).toBeVisible();
  await expect(upload).not.toHaveText(/^\s*$/);

  const frames = page.locator('iframe[title="Страница сайта"]');
  if ((await frames.count()) > 0) {
    const preview = page.frameLocator('iframe[title="Страница сайта"]');
    for (const item of candidateOnly) {
      await expect(preview.getByText(item, { exact: true })).toHaveCount(0);
    }
  }

  for (const item of candidateOnly) {
    await expect(
      page.getByRole('main').getByText(item, { exact: true }),
    ).toHaveCount(0);
  }
}

export async function expectCandidatePreview(page: Page): Promise<void> {
  await page.goto(`/manage/${owner.slug}/preview`);
  const preview = page.frameLocator('iframe[title="Страница сайта"]');
  for (const item of candidateMenu) {
    await expect(preview.getByText(item, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('main')).toContainText(activeStatus(activeLabel));
}

export async function confirmPublish(page: Page): Promise<void> {
  await page.goto(`/manage/${owner.slug}/versions`);
  await page
    .getByRole('main')
    .getByRole('button', { name: publishButtonName })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: publishButtonName }).click();
}

export async function expectFailedPublication(page: Page): Promise<void> {
  await page.goto(`/manage/${owner.slug}/versions`);
  await expect(page.getByRole('main')).toContainText(
    publishFailed(activeLabel),
  );
  await expectDashboardActive(page, activeLabel);
}

export async function expectDashboardActive(
  page: Page,
  label: string,
): Promise<void> {
  await page.goto(`/manage/${owner.slug}`);
  await expect(page.getByRole('main')).toContainText(
    new RegExp(`Активн(?:ая|а) версия:?\\s*${escapeRegExp(label)}\\b`),
  );
}

export async function expectPublicMenu(
  page: Page,
  present: readonly string[],
  absent: readonly string[],
): Promise<void> {
  await page.goto(`/site/${owner.slug}`);
  const frame = page.frameLocator('iframe[title="Страница сайта"]');
  for (const item of present) {
    await expect(frame.getByText(item, { exact: true })).toBeVisible();
  }
  for (const item of absent) {
    await expect(frame.getByText(item, { exact: true })).toHaveCount(0);
  }
}
