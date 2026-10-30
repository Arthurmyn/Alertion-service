import { expect, type Locator, type Page } from '@playwright/test';
import {
  accounts,
  baseline,
  baselineUpdatedAt,
} from '../../src/data/accounts.ts';
import { archives, type ArchiveFixture } from '../../src/data/archives.ts';
import { sampleSites } from '../../src/data/sampleSites.ts';
import { LIMITS } from '../../src/data/limits.ts';
import { reducer } from '../../src/state/reducer.ts';
import type { Site } from '../../src/state/types.ts';
import { validateArchive } from '../../src/state/validateArchive.ts';

const owner = accounts[0];
if (!owner) throw new Error('missing account A');

export const ownerA = owner;

export function fixture(name: string): ArchiveFixture {
  const archive = archives[name];
  if (!archive) throw new Error(`missing ${name}`);
  return archive;
}

export function baselineSite(): Site {
  const site = baseline.sites[ownerA.slug];
  if (!site) throw new Error(`missing ${ownerA.slug}`);
  return site;
}

export function activeVersion(site: Site) {
  const version = site.versions.find(
    (item) => item.id === site.activeVersionId,
  );
  if (!version) throw new Error('active version missing');
  return version;
}

/** Upload and publish of v2, v3 and v4, the retained state behind reject-storage. */
export function storageScenarioSite(): Site {
  let state = reducer(baseline, { type: 'signIn', accountId: ownerA.id });
  for (const name of ['nan-v2.zip', 'nan-v3.zip', 'nan-v4.zip']) {
    state = reducer(state, {
      type: 'upload',
      slug: ownerA.slug,
      archive: fixture(name),
      uploadedAt: baselineUpdatedAt,
    });
    state = reducer(state, { type: 'publish', slug: ownerA.slug });
  }
  const site = state.sites[ownerA.slug];
  if (!site) throw new Error(`missing ${ownerA.slug}`);
  return site;
}

export function rejectionMessage(archiveName: string, site: Site): string {
  const result = validateArchive(fixture(archiveName), site, LIMITS);
  if (result.ok) throw new Error(`${archiveName} should be rejected`);
  return result.nextStep;
}

export function unchangedSentence(label: string): string {
  return `Активная версия не изменилась: ${label}.`;
}

export function unsafePath(archiveName: string): string {
  const path = fixture(archiveName).files.find((file) => file.includes('..'));
  if (!path) throw new Error(`${archiveName} has no unsafe path`);
  return path;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nav(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Разделы' });
}

export async function signInAsOwner(page: Page): Promise<void> {
  await page.goto('/login');
  await page
    .getByRole('button', {
      name: new RegExp(
        `${escapeRegExp(ownerA.businessName)}|${escapeRegExp(ownerA.ownerName)}`,
      ),
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`/manage/${ownerA.slug}$`));
}

export async function openUpload(page: Page): Promise<void> {
  await nav(page).getByRole('link', { name: 'Загрузка' }).click();
  await expect(page).toHaveURL(new RegExp(`/manage/${ownerA.slug}/upload$`));
}

export async function openScenario(page: Page, id: string): Promise<void> {
  await page.goto(`/?scenario=${id}`);
  await expect(page).not.toHaveURL(/[?&]scenario=/);
  await page.goto(`/manage/${ownerA.slug}/upload`);
  await expect(page).toHaveURL(new RegExp(`/manage/${ownerA.slug}/upload$`));
}

export async function checkArchive(
  page: Page,
  archiveName: string,
): Promise<void> {
  await page.getByRole('radio', { name: archiveName }).check();
  await page.getByRole('button', { name: 'Проверить архив' }).click();
}

export async function expectRejection(
  page: Page,
  archiveName: string,
  site: Site,
): Promise<void> {
  const active = activeVersion(site);
  const message = rejectionMessage(archiveName, site);
  await checkArchive(page, archiveName);
  expect(message.endsWith(unchangedSentence(active.label))).toBe(true);
  if (archiveName === 'nan-no-index.zip' || archiveName === 'nan-unsafe.zip') {
    expect(message).not.toContain('Лимит пилотного плана');
  }
  await expect(page.locator('main').getByText(message)).toBeVisible();
  await nav(page).getByRole('link', { name: 'Управление сайтом' }).click();
  await expect(page).toHaveURL(new RegExp(`/manage/${ownerA.slug}$`));
  const activeFact = page.locator('main dl > div').filter({
    has: page.getByRole('term').filter({ hasText: /^Активная версия$/ }),
  });
  await expect(activeFact).toHaveCount(1);
  await expect(activeFact.getByRole('definition')).toHaveText(active.label);
  await page.goto(`/site/${ownerA.slug}`);
  await expectActiveSample(page, active.archiveName);
}

export function examplePath(): string {
  return `/site/${ownerA.slug}`;
}

function listItems(html: string): string[] {
  return [...html.matchAll(/<li>([^<]*)<\/li>/g)].map(
    (match) => match[1] ?? '',
  );
}

export async function expectActiveSample(
  page: Page,
  archiveName: string,
): Promise<void> {
  const html = sampleSites[archiveName];
  if (!html) throw new Error(`no sample for ${archiveName}`);
  const frame = page.frameLocator('iframe[title="Страница сайта"]');
  await expect(
    frame.getByRole('heading', { name: ownerA.businessName }),
  ).toBeVisible();
  const shown = new Set(listItems(html));
  for (const item of shown) {
    await expect(frame.getByText(item, { exact: true })).toBeVisible();
  }
  const hidden = new Set<string>();
  for (const sample of Object.values(sampleSites)) {
    for (const item of listItems(sample)) {
      if (!shown.has(item)) hidden.add(item);
    }
  }
  for (const item of hidden) {
    await expect(frame.getByText(item, { exact: true })).toHaveCount(0);
  }
  await expect(frame.locator('script')).toHaveCount(0);
}
