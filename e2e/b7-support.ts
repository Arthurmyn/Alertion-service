import { expect, type Page } from '@playwright/test';
import { accounts, baseline, type Account } from '../src/data/accounts.ts';
import { archives, type ArchiveFixture } from '../src/data/archives.ts';
import { LIMITS } from '../src/data/limits.ts';
import { storageUsedMb } from '../src/state/selectors.ts';

export const planGate = 'Сначала выберите пилотный план';

const publishNames = ['nan-v2.zip', 'nan-v3.zip', 'nan-v4.zip'] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function accountById(id: Account['id']): Account {
  const account = accounts.find((item) => item.id === id);
  if (!account) throw new Error(`missing account ${id}`);
  return account;
}

function fixture(name: string): ArchiveFixture {
  const archive = archives[name];
  if (!archive) throw new Error(`missing fixture ${name}`);
  return archive;
}

function mb(value: number): string {
  return `${value} МБ`;
}

function unpackedMb(name: string): number {
  const value = fixture(name).unpackedMb;
  if (value === null) throw new Error(`${name} has no unpacked size`);
  return value;
}

function archiveMb(name: string): number {
  const value = fixture(name).archiveMb;
  if (value === null) throw new Error(`${name} has no archive size`);
  return value;
}

function labelOf(name: string): string {
  const label = fixture(name).label;
  if (!label) throw new Error(`${name} has no version label`);
  return label;
}

function sizeRejection(
  subject: string,
  actualMb: number,
  limitMb: number,
  action: string,
  activeLabel: string,
): string {
  return `${subject} ${mb(actualMb)}. Лимит пилотного плана: ${mb(limitMb)}. ${action} Активная версия не изменилась: ${activeLabel}.`;
}

export function archiveSizeMessage(): string {
  return sizeRejection(
    'Архив',
    archiveMb('nan-28mb.zip'),
    LIMITS.archiveMb,
    'Сожмите изображения или уберите видео и загрузите архив снова.',
    labelOf('nan-v1.zip'),
  );
}

export function unpackedSizeMessage(): string {
  return sizeRejection(
    'Распакованная версия',
    unpackedMb('nan-unpack-60.zip'),
    LIMITS.unpackedMb,
    'Уберите лишние файлы и загрузите архив снова.',
    labelOf('nan-v1.zip'),
  );
}

export function storageSizeMessage(): string {
  const retainedMb = publishNames.reduce(
    (total, name) => total + unpackedMb(name),
    unpackedMb('nan-v1.zip'),
  );
  const actualMb = retainedMb + unpackedMb('nan-storage.zip');
  const freeMb = Math.max(LIMITS.storageMb - retainedMb, 0);
  return sizeRejection(
    'Хранилище',
    actualMb,
    LIMITS.storageMb,
    `Загрузите архив с распакованным размером до ${mb(freeMb)}.`,
    labelOf('nan-v4.zip'),
  );
}

export function siteLimitMessage(): string {
  return `Сайт уже есть. Лимит пилотного плана: ${LIMITS.sites} сайт. Работайте с текущим сайтом.`;
}

export function dashboardStorageLine(): string {
  const site = baseline.sites.nan;
  if (!site) throw new Error('baseline has no nan');
  return `${mb(storageUsedMb(site))} из ${mb(LIMITS.storageMb)}`;
}

export function main(page: Page) {
  return page.getByRole('main');
}

function sections(page: Page) {
  return page.getByRole('navigation', { name: 'Разделы' });
}

export async function signIn(page: Page): Promise<Account> {
  const account = accountById('a');
  await page.goto('/login');
  await page
    .getByRole('button', {
      name: new RegExp(
        `${escapeRegExp(account.businessName)}|${escapeRegExp(account.ownerName)}`,
      ),
    })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/manage/${account.slug}(?:/|\\?|$)`),
  );
  return account;
}

export async function openSection(page: Page, name: string): Promise<void> {
  await sections(page).getByRole('link', { name, exact: true }).click();
}

/** `plan-not-selected` is the only signed-in state with no plan: selection has no off toggle. */
export async function openScenario(page: Page, id: string): Promise<string> {
  await page.goto(`/?scenario=${id}`);
  await expect(page).not.toHaveURL(/[?&]scenario=/);
  const match = new URL(page.url()).pathname.match(/^\/manage\/([^/]+)/);
  const slug = match?.[1];
  if (!slug) throw new Error(`scenario ${id} did not open a management route`);
  return decodeURIComponent(slug);
}

export async function expectPlanLimits(page: Page): Promise<void> {
  const region = main(page);
  await expect(region).toContainText(`${LIMITS.sites} сайт`);
  await expect(region).toContainText(mb(LIMITS.archiveMb));
  await expect(region).toContainText(mb(LIMITS.unpackedMb));
  await expect(region).toContainText(mb(LIMITS.storageMb));
}

export async function expectUploadLimits(page: Page): Promise<void> {
  const region = main(page);
  await expect(region).toContainText(mb(LIMITS.archiveMb));
  await expect(region).toContainText(mb(LIMITS.unpackedMb));
  await expect(region).toContainText(mb(LIMITS.storageMb));
}

async function checkArchive(page: Page, fileName: string): Promise<void> {
  await openSection(page, 'Загрузка');
  const status = main(page).locator('[aria-live="polite"]');
  const before = await status.innerText();
  await page
    .getByRole('radio', { name: new RegExp(escapeRegExp(fileName)) })
    .check();
  await page
    .getByRole('button', { name: 'Проверить архив', exact: true })
    .click();
  // Leaving the page during «Проверяем архив…» cancels the check.
  await expect.poll(async () => status.innerText()).not.toBe(before);
  await expect(status).not.toContainText('Проверяем архив…');
}

async function publishCandidate(page: Page, label: string): Promise<void> {
  const name = `Опубликовать версию ${label}`;
  await openSection(page, 'Версии');
  await main(page).getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name, exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function rejectArchiveSize(page: Page): Promise<void> {
  await checkArchive(page, 'nan-28mb.zip');
  await expect(main(page)).toContainText(archiveSizeMessage());
}

export async function rejectUnpackedSize(page: Page): Promise<void> {
  await checkArchive(page, 'nan-unpack-60.zip');
  await expect(main(page)).toContainText(unpackedSizeMessage());
}

export async function rejectStorage(page: Page): Promise<void> {
  for (const name of publishNames) {
    await checkArchive(page, name);
    await publishCandidate(page, labelOf(name));
  }
  await checkArchive(page, 'nan-storage.zip');
  await expect(main(page)).toContainText(storageSizeMessage());
}

export async function rejectSecondSite(
  page: Page,
  account: Account,
): Promise<void> {
  await openSection(page, 'Пилотный план');
  await main(page)
    .getByRole('button', { name: 'Добавить сайт', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/manage/${account.slug}/plan/?$`));
  await expect(main(page)).toContainText(siteLimitMessage());
  await expect(main(page)).toContainText(account.businessName);
  await expect(main(page)).not.toContainText(accountById('b').businessName);
}

export async function choosePilotPlan(page: Page): Promise<void> {
  const choose = main(page)
    .getByRole('button')
    .filter({ hasNotText: 'Добавить сайт' });
  await expect(choose).toHaveCount(1);
  await choose.click();
}
