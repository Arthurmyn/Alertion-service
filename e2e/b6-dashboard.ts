import { expect, type Page } from '@playwright/test';
import { accounts, baselineUpdatedAt } from '../src/data/accounts.ts';
import { archives } from '../src/data/archives.ts';
import { LIMITS } from '../src/data/limits.ts';

const deploymentText = {
  published: 'Опубликовано',
  publishFailed: 'Ошибка публикации',
  rolledBack: 'Откат выполнен',
  rollbackFailed: 'Ошибка отката',
} as const;

const deferredStatus = 'Недоступно в этой версии прототипа';

export const scenarioTourTimeout = 180_000;

export interface DashboardScenario {
  id: string;
  slug: string;
  activeLabel: string;
  deployment: string;
  usedMb: number;
  domain?: 'pending' | 'active' | 'failed' | 'deferred';
}

function accountById(id: 'a' | 'b') {
  const found = accounts.find((item) => item.id === id);
  if (!found) throw new Error(`missing account ${id}`);
  return found;
}

function unpackedOf(name: string): number {
  const value = archives[name]?.unpackedMb;
  if (value === null || value === undefined) {
    throw new Error(`${name} has no unpacked size`);
  }
  return value;
}

function versionLabel(name: string): string {
  const value = archives[name]?.label;
  if (!value) throw new Error(`${name} has no version label`);
  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const accountA = accountById('a');
const accountB = accountById('b');
const nanV1 = 'nan-v1.zip';
const nanV2 = 'nan-v2.zip';
const nanV3 = 'nan-v3.zip';
const nanV4 = 'nan-v4.zip';
const temirV1 = 'temir-v1.zip';

const baselineNan = unpackedOf(nanV1);
const withVersionB = baselineNan + unpackedOf(nanV2);
// v2, v3 and v4 are published; the rejected archive is not retained.
const retainedForStorageRejection =
  withVersionB + unpackedOf(nanV3) + unpackedOf(nanV4);

function nan(
  id: string,
  patch: Partial<DashboardScenario> = {},
): DashboardScenario {
  return {
    id,
    slug: accountA.slug,
    activeLabel: versionLabel(nanV1),
    deployment: deploymentText.published,
    usedMb: baselineNan,
    ...patch,
  };
}

// Owner dashboards. signed-out and b-opens-a are login and access denial.
export const ownerScenarios: readonly DashboardScenario[] = [
  nan('a-home'),
  {
    id: 'b-home',
    slug: accountB.slug,
    activeLabel: versionLabel(temirV1),
    deployment: deploymentText.published,
    usedMb: unpackedOf(temirV1),
  },
  nan('plan-not-selected'),
  nan('reject-no-index'),
  nan('reject-unsafe-path'),
  nan('reject-archive-size'),
  nan('reject-unpacked-size'),
  nan('reject-storage', {
    activeLabel: versionLabel(nanV4),
    usedMb: retainedForStorageRejection,
  }),
  nan('second-site'),
  nan('preview-b', { usedMb: withVersionB }),
  nan('publish-ok', {
    activeLabel: versionLabel(nanV2),
    usedMb: withVersionB,
  }),
  nan('publish-fail', {
    deployment: deploymentText.publishFailed,
    usedMb: withVersionB,
  }),
  nan('rollback-ok', {
    deployment: deploymentText.rolledBack,
    usedMb: withVersionB,
  }),
  nan('rollback-none'),
  nan('rollback-fail', {
    activeLabel: versionLabel(nanV2),
    deployment: deploymentText.rollbackFailed,
    usedMb: withVersionB,
  }),
  nan('domain-pending', { domain: 'pending' }),
  nan('domain-active', { domain: 'active' }),
  nan('domain-failed', { domain: 'failed' }),
  nan('domain-deferred', { domain: 'deferred' }),
  nan('storage-stale'),
];

export const deploymentScenarios = ownerScenarios.filter(
  (scenario) =>
    scenario.id.startsWith('publish-') || scenario.id.startsWith('rollback-'),
);

export const domainScenarios = ownerScenarios.filter(
  (
    scenario,
  ): scenario is DashboardScenario & {
    domain: NonNullable<DashboardScenario['domain']>;
  } => scenario.domain !== undefined,
);

export function scenarioById(id: string): DashboardScenario {
  const found = ownerScenarios.find((scenario) => scenario.id === id);
  if (!found) throw new Error(`missing scenario ${id}`);
  return found;
}

function examplePath(slug: string): string {
  return `/site/${slug}`;
}

export function storagePattern(usedMb: number): RegExp {
  return new RegExp(
    `${escapeRegExp(String(usedMb))}\\s*МБ\\s*из\\s*${LIMITS.storageMb}\\s*МБ`,
  );
}

export async function openDashboard(
  page: Page,
  scenarioId: string,
  slug: string,
): Promise<void> {
  page.setDefaultTimeout(15_000);
  await page.goto(`/?scenario=${encodeURIComponent(scenarioId)}`);
  await expect(page).not.toHaveURL(/[?&]scenario=/);

  const dashboard = new RegExp(`/manage/${escapeRegExp(slug)}$`);
  if (!dashboard.test(new URL(page.url()).pathname)) {
    await page
      .getByRole('navigation', { name: 'Разделы' })
      .getByRole('link', { name: 'Управление сайтом', exact: true })
      .click();
  }
  await expect(page).toHaveURL(dashboard);
}

export async function expectActiveVersion(
  page: Page,
  label: string,
): Promise<void> {
  await expect(
    page.getByText(
      new RegExp(
        `активн\\S*\\s+верси\\S*\\s*[:—–-]?\\s*${escapeRegExp(label)}\\b`,
        'i',
      ),
    ),
  ).toBeVisible();
}

export async function expectStorage(page: Page, usedMb: number): Promise<void> {
  await expect(page.getByText(storagePattern(usedMb))).toBeVisible();
}

export async function expectDeployment(
  page: Page,
  deployment: string,
): Promise<void> {
  await expect(page.getByText(deployment, { exact: true })).toBeVisible();
}

function exampleLink(page: Page, slug: string) {
  return page.getByRole('link', {
    name: new RegExp(escapeRegExp(examplePath(slug))),
  });
}

export async function expectExampleLink(
  page: Page,
  slug: string,
): Promise<void> {
  const path = examplePath(slug);
  const link = exampleLink(page, slug);
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    new RegExp(`${escapeRegExp(path)}$`),
  );
}

export async function followExampleLink(
  page: Page,
  slug: string,
): Promise<void> {
  await expectExampleLink(page, slug);
  await exampleLink(page, slug).click();
  await expect(page).toHaveURL(
    new RegExp(`${escapeRegExp(examplePath(slug))}$`),
  );
}

export async function expectDomainState(
  page: Page,
  domain: NonNullable<DashboardScenario['domain']>,
): Promise<void> {
  if (domain === 'pending') {
    await expect(page.getByText('Ожидание', { exact: true })).toBeVisible();
    return;
  }
  if (domain === 'active') {
    await expect(page.getByText('Активен', { exact: true })).toBeVisible();
    return;
  }
  if (domain === 'failed') {
    await expect(page.getByText('Ошибка', { exact: true })).toBeVisible();
    return;
  }
  await expect(page.getByText(deferredStatus)).toBeVisible();
}

export async function openDomainScreen(
  page: Page,
  slug: string,
): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Разделы' })
    .getByRole('link', { name: 'Домен', exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/manage/${escapeRegExp(slug)}/domain$`),
  );
}

export async function expectStaleNotice(page: Page): Promise<void> {
  const notice = page.getByText(/Данные устарели,\s*обновлено\s+\S/);
  await expect(notice).toBeVisible();
  const updated = new Date(baselineUpdatedAt);
  const year = String(updated.getUTCFullYear());
  const day = String(updated.getUTCDate());
  const clock = baselineUpdatedAt.slice(11, 16);
  await expect(notice).toContainText(
    new RegExp(`${day}[\\s\\S]*${year}|${year}[\\s\\S]*${day}|${clock}`),
  );
}

export function deferredDashboardPattern(): RegExp {
  return /Домен:\s*недоступно в этой версии прототипа/i;
}
