import { expect, type Browser, type Page } from '@playwright/test';
import { accounts, baseline, baselineUpdatedAt } from '../src/data/accounts.ts';
import { archives, type ArchiveFixture } from '../src/data/archives.ts';
import { sampleSites } from '../src/data/sampleSites.ts';
import { reducer } from '../src/state/reducer.ts';
import type { AppState } from '../src/state/types.ts';

const SESSION_KEY = 'alertion.session';
const seededFlag = 'alertion.e2e.seeded';
const frameTitle = 'Страница сайта';

export const archiveA = 'nan-v1.zip';
export const archiveB = 'nan-v2.zip';
export const accountA = accountById('a');
export const accountB = accountById('b');

export function activeArchiveName(slug: string): string {
  const site = baseline.sites[slug];
  if (!site) throw new Error(`missing site ${slug}`);
  const version = site.versions.find(
    (item) => item.id === site.activeVersionId,
  );
  if (!version) throw new Error(`missing active version for ${slug}`);
  return version.archiveName;
}

type FixtureAccount = (typeof accounts)[number];
type Simulate = Partial<AppState['simulate']>;

function accountById(id: FixtureAccount['id']): FixtureAccount {
  const account = accounts.find((item) => item.id === id);
  if (!account) throw new Error(`missing account ${id}`);
  return account;
}

function archive(name: string): ArchiveFixture {
  const item = archives[name];
  if (!item) throw new Error(`missing archive ${name}`);
  return item;
}

export function versionLabel(name: string): string {
  const label = archive(name).label;
  if (label === null) throw new Error(`${name} has no version label`);
  return label;
}

function versionId(name: string): string {
  return name.replace(/\.zip$/, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function menuItems(name: string): string[] {
  const html = sampleSites[name];
  if (!html) throw new Error(`missing sample site ${name}`);
  return [...html.matchAll(/<li>([^<]*)<\/li>/g)].map(
    (match) => match[1] ?? '',
  );
}

function onlyIn(source: string, base: string): string[] {
  const present = new Set(menuItems(base));
  return menuItems(source).filter((item) => !present.has(item));
}

export function activeLine(label: string): string {
  return `Активна версия ${label}`;
}

export function candidateLine(label: string): string {
  return `Кандидат: версия ${label}`;
}

export function publishName(label: string): string {
  return `Опубликовать версию ${label}`;
}

export function rollbackName(label: string): string {
  return `Вернуть версию ${label}`;
}

export function publishFailedLine(label: string): string {
  return `Публикация не прошла. Активная версия: ${label}.`;
}

export function rollbackFailedLine(label: string): string {
  return `Откат не прошёл. Активная версия: ${label}.`;
}

export const noHistoryLine = 'Откат недоступен: предыдущей версии нет.';

function withSimulate(state: AppState, simulate: Simulate): AppState {
  return { ...state, simulate: { ...state.simulate, ...simulate } };
}

export function candidateOf(name: string, simulate: Simulate = {}): AppState {
  return reducer(withSimulate(baseline, simulate), {
    type: 'upload',
    slug: accountA.slug,
    archive: archive(name),
    uploadedAt: baselineUpdatedAt,
  });
}

export function publishedOf(name: string, simulate: Simulate = {}): AppState {
  return reducer(candidateOf(name, simulate), {
    type: 'publish',
    slug: accountA.slug,
  });
}

async function seed(page: Page, state: AppState): Promise<void> {
  // Apply the prepared state on the first load only, so later visits keep
  // the signed-in session the screen writes.
  await page.addInitScript(
    (data: { key: string; flag: string; value: string }) => {
      if (sessionStorage.getItem(data.flag)) return;
      sessionStorage.setItem(data.key, data.value);
      sessionStorage.setItem(data.flag, '1');
    },
    { key: SESSION_KEY, flag: seededFlag, value: JSON.stringify(state) },
  );
}

export async function withApp(
  browser: Browser,
  state: AppState,
  run: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await seed(page, state);
    await page.goto('/login');
    await run(page);
  } finally {
    await context.close();
  }
}

export async function signIn(
  page: Page,
  account: FixtureAccount,
): Promise<void> {
  const name = new RegExp(
    `${escapeRegExp(account.businessName)}|${escapeRegExp(account.ownerName)}`,
  );
  await page.getByRole('button', { name }).click();
  await page.waitForFunction(
    (expected: { key: string; accountId: string }) => {
      const raw = sessionStorage.getItem(expected.key);
      if (!raw) return false;
      try {
        const stored = JSON.parse(raw) as { sessionAccountId?: string | null };
        return stored.sessionAccountId === expected.accountId;
      } catch {
        return false;
      }
    },
    { key: SESSION_KEY, accountId: account.id },
  );
}

export async function openVersions(
  page: Page,
  account: FixtureAccount,
): Promise<void> {
  await page.goto(`/manage/${account.slug}/versions`);
  await expect(page).toHaveURL(new RegExp(`/manage/${account.slug}/versions$`));
}

export async function confirmAction(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name, exact: true }).click();
  await expect(dialog).toBeHidden();
}

async function waitForActiveArchive(
  page: Page,
  slug: string,
  name: string,
): Promise<void> {
  await page.waitForFunction(
    (expected: { key: string; slug: string; id: string }) => {
      const raw = sessionStorage.getItem(expected.key);
      if (!raw) return false;
      try {
        const stored = JSON.parse(raw) as {
          sites?: Record<string, { activeVersionId?: string }>;
        };
        return stored.sites?.[expected.slug]?.activeVersionId === expected.id;
      } catch {
        return false;
      }
    },
    { key: SESSION_KEY, slug, id: versionId(name) },
  );
}

export async function expectFrameMenu(
  page: Page,
  name: string,
  hiddenName?: string,
): Promise<void> {
  const frame = page.frameLocator(`iframe[title="${frameTitle}"]`);
  for (const item of menuItems(name)) {
    await expect(frame.getByText(item, { exact: true })).toBeVisible();
  }
  if (!hiddenName) return;
  for (const item of onlyIn(hiddenName, name)) {
    await expect(frame.getByText(item, { exact: true })).toHaveCount(0);
  }
}

export async function expectPublicSite(
  page: Page,
  slug: string,
  name: string,
  hiddenName?: string,
): Promise<void> {
  await waitForActiveArchive(page, slug, name);
  await page.goto(`/site/${slug}`);
  await expectFrameMenu(page, name, hiddenName);
}

export async function expectNoHistory(page: Page): Promise<void> {
  const rollback = page.getByRole('button', { name: /Вернуть версию/ });
  await expect(rollback).toHaveCount(1);
  await expect(rollback).toBeDisabled();
  await expect(page.getByText(noHistoryLine, { exact: true })).toBeVisible();
}
