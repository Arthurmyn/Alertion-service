import { expect, type Locator, type Page } from '@playwright/test';
import { accounts, baseline } from '../../src/data/accounts.ts';
import { archives, type ArchiveFixture } from '../../src/data/archives.ts';
import { LIMITS } from '../../src/data/limits.ts';
import { sampleSites } from '../../src/data/sampleSites.ts';
import { reducer } from '../../src/state/reducer.ts';
import type { AccountId } from '../../src/state/types.ts';

const SESSION_KEY = 'alertion.session';

export const accountA = accounts[0];
export const accountB = accounts[1];

const numberFormat = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
});

function mb(value: number): string {
  return `${numberFormat.format(value)} МБ`;
}

function sized(
  archive: ArchiveFixture,
  field: 'archiveMb' | 'unpackedMb',
): number {
  const value = archive[field];
  if (value === null) throw new Error(`${archive.name} has no ${field}`);
  return value;
}

function labelOf(archive: ArchiveFixture): string {
  if (!archive.label) throw new Error(`${archive.name} has no version label`);
  return archive.label;
}

const versionA = archives['nan-v1.zip'];
const versionB = archives['nan-v2.zip'];
const oversizedArchive = archives['nan-28mb.zip'];

if (!versionA || !versionB || !oversizedArchive) {
  throw new Error('nan fixtures are missing');
}
if (accountA.id !== 'a' || accountB.id !== 'b') {
  throw new Error('account fixture ids changed');
}

const labelA = labelOf(versionA);
const labelB = labelOf(versionB);
const baselineStorageMb = sized(versionA, 'unpackedMb');
const publishedStorageMb = baselineStorageMb + sized(versionB, 'unpackedMb');
const oversizedArchiveMb = sized(oversizedArchive, 'archiveMb');

function listItems(html: string | undefined, name: string): string[] {
  if (!html) throw new Error(`${name} has no sample page`);
  return [...html.matchAll(/<li>([^<]*)<\/li>/g)].map(
    (match) => match[1] ?? '',
  );
}

export const activeMenu = listItems(sampleSites[versionA.name], versionA.name);
const candidateMenu = listItems(sampleSites[versionB.name], versionB.name);
export const publishedExtra = candidateMenu.filter(
  (item) => !activeMenu.includes(item),
);

const storageNow = (usedMb: number): string =>
  `${mb(usedMb)} из ${mb(LIMITS.storageMb)}`;

export type DemoStep = {
  n: number;
  caption: string;
  path?: string;
};

export const demoSteps: readonly DemoStep[] = [
  {
    n: 1,
    path: `/manage/${accountA.slug}`,
    caption: `Активна версия ${labelA}. Хранилище: ${storageNow(baselineStorageMb)}.`,
  },
  {
    n: 2,
    path: `/site/${accountA.slug}`,
    caption: `Публичная страница версии ${labelA}. Данных управления здесь нет.`,
  },
  {
    n: 3,
    caption: `Архив ${mb(oversizedArchiveMb)} больше лимита ${mb(LIMITS.archiveMb)}. Активная версия по-прежнему ${labelA}.`,
  },
  {
    n: 4,
    caption: `Проверка прошла. Версия ${labelB} стала кандидатом. Адрес сайта всё ещё показывает ${labelA}.`,
  },
  {
    n: 5,
    path: `/manage/${accountA.slug}/preview`,
    caption: `Предпросмотр ${labelB} видите только вы. Активна версия ${labelA}.`,
  },
  {
    n: 6,
    caption: `Версия ${labelB} опубликована.`,
  },
  {
    n: 7,
    path: `/site/${accountA.slug}`,
    caption: 'На публичной странице появился круассан.',
  },
  {
    n: 8,
    path: `/manage/${accountA.slug}/versions`,
    caption: `Снова активна версия ${labelA}.`,
  },
  {
    n: 9,
    path: `/manage/${accountA.slug}`,
    caption: `Версия ${labelA} активна. Хранилище: ${storageNow(publishedStorageMb)}.`,
  },
  {
    n: 10,
    path: '/defense#demo',
    caption: 'Демо завершено.',
  },
];

export function stepLabel(n: number): string {
  return `Шаг ${n} из ${demoSteps.length}`;
}

export function urlEnding(path: string): RegExp {
  return new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

type ResultCase = {
  id: string;
  quote: string;
  scenarios?: readonly string[];
  anyScenario?: boolean;
  evidenceHref?: string;
};

const sharedRejection =
  'A missing entry page, unsafe path or oversized upload produces a clear rejection message.';
const sharedPublish =
  'Confirmation makes B active, while a failed publication keeps A active.';
const sharedDomain =
  'Pending and failed states have different explanations, and domain/certificate values are clearly marked as examples.';
const sharedDashboard =
  'The active version, example URL, deployment state, domain state and storage match the scenario.';

const rejectScenarios = [
  'reject-no-index',
  'reject-unsafe-path',
  'reject-archive-size',
  'reject-unpacked-size',
  'reject-storage',
] as const;

const domainScenarios = [
  'domain-pending',
  'domain-active',
  'domain-failed',
  'domain-deferred',
] as const;

export const resultCases: readonly ResultCase[] = [
  {
    id: 'B1-AC1',
    quote:
      'Public website content and private management data are clearly distinguished.',
    scenarios: ['a-home'],
  },
  {
    id: 'B1-AC2',
    quote: "Account B is denied access to account A's management screens.",
    scenarios: ['b-opens-a'],
  },
  {
    id: 'B2-AC1',
    quote: 'A valid upload reaches the example URL.',
    scenarios: ['publish-ok'],
  },
  {
    id: 'B2-AC2',
    quote: sharedRejection,
    scenarios: ['reject-no-index'],
  },
  {
    id: 'B2-AC3',
    quote: sharedRejection,
    scenarios: ['reject-unsafe-path'],
  },
  {
    id: 'B2-AC4',
    quote: sharedRejection,
    scenarios: [
      'reject-archive-size',
      'reject-unpacked-size',
      'reject-storage',
    ],
  },
  {
    id: 'B2-AC5',
    quote: 'A failed upload keeps the active version unchanged.',
    scenarios: rejectScenarios,
  },
  {
    id: 'B3-AC1',
    quote: 'Previewing B leaves A active.',
    scenarios: ['preview-b'],
  },
  {
    id: 'B3-AC2',
    quote: sharedPublish,
    scenarios: ['publish-ok'],
  },
  {
    id: 'B3-AC3',
    quote: sharedPublish,
    scenarios: ['publish-fail'],
  },
  {
    id: 'B3-AC4',
    quote: 'The preview screen explains who can view it.',
    scenarios: ['preview-b'],
  },
  {
    id: 'B4-AC1',
    quote: 'Rolling back after publishing B restores A.',
    scenarios: ['rollback-ok'],
  },
  {
    id: 'B4-AC2',
    quote:
      'With no history available, rollback is disabled and the screen explains why.',
    scenarios: ['rollback-none', 'b-home'],
  },
  {
    id: 'B4-AC3',
    quote: 'A failed rollback preserves the current version label.',
    scenarios: ['rollback-fail'],
  },
  {
    id: 'B5-AC1',
    quote: 'Domain-control verification comes before activation.',
    scenarios: ['domain-pending', 'domain-active'],
  },
  {
    id: 'B5-AC2',
    quote: sharedDomain,
    scenarios: ['domain-pending', 'domain-failed'],
  },
  {
    id: 'B5-AC3',
    quote: sharedDomain,
    scenarios: domainScenarios,
  },
  {
    id: 'B5-AC4',
    quote:
      'Section 3.2 describes the smaller version if scope needs to change.',
    evidenceHref: '#goals',
  },
  {
    id: 'B6-AC1',
    quote: sharedDashboard,
    anyScenario: true,
  },
  {
    id: 'B6-AC2',
    quote: sharedDashboard,
    anyScenario: true,
  },
  {
    id: 'B6-AC3',
    quote: sharedDashboard,
    scenarios: ['publish-ok', 'publish-fail', 'rollback-ok', 'rollback-fail'],
  },
  {
    id: 'B6-AC4',
    quote: sharedDashboard,
    scenarios: domainScenarios,
  },
  {
    id: 'B6-AC5',
    quote: sharedDashboard,
    scenarios: ['a-home', 'b-home', 'publish-ok'],
  },
  {
    id: 'B6-AC6',
    quote: 'If domain work is deferred, the dashboard labels it unavailable.',
    scenarios: ['domain-deferred'],
  },
  {
    id: 'B7-AC1',
    quote: 'Plan, upload and dashboard values agree.',
    scenarios: ['a-home'],
  },
  {
    id: 'B7-AC2',
    quote:
      'The rejection message explains which limit was exceeded and what the owner can do next.',
    scenarios: [
      'reject-archive-size',
      'reject-unpacked-size',
      'reject-storage',
      'second-site',
    ],
  },
];

export const goalCases = [
  {
    id: 'G1',
    quote:
      'at least four of five team members should complete the upload-to-publication scenario without help.',
    deferred: true,
  },
  {
    id: 'G2',
    quote:
      'Demonstrate preview with A still active, confirmed publication of B and rollback to A. Failed actions must preserve the current version label.',
    deferred: false,
  },
  {
    id: 'G3',
    quote:
      'Check signed-out access, account-ownership denial, an unsafe upload and an over-limit upload against the expected prototype behavior.',
    deferred: false,
  },
  {
    id: 'G4',
    quote:
      'Distinguish pending, active and failed domain/HTTPS states and explain domain-control verification before activation. If we reduce the scope, we will record which checks remain and which are deferred.',
    deferred: false,
  },
  {
    id: 'G5',
    quote:
      'At least four of five members should explain the displayed limit and what happens when it is exceeded.',
    deferred: true,
  },
] as const;

export async function expectResultRow(
  results: Locator,
  item: ResultCase,
): Promise<void> {
  const row = results.getByRole('row').filter({ hasText: item.id });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(item.quote);
  for (const id of item.scenarios ?? []) {
    await expect(row.locator(`a[href*="scenario=${id}"]`)).toBeVisible();
  }
  if (item.anyScenario) {
    await expect(row.locator('a[href*="scenario="]').first()).toBeVisible();
  }
  if (item.evidenceHref) {
    await expect(row.locator(`a[href*="${item.evidenceHref}"]`)).toBeVisible();
  }
  await expect(row.locator('img').first()).toBeVisible();
}

function savedSession(accountId: AccountId): string {
  return JSON.stringify(reducer(baseline, { type: 'signIn', accountId }));
}

export async function plantSession(
  page: Page,
  accountId: AccountId,
): Promise<void> {
  await page.addInitScript(
    ({ key, json }) => {
      sessionStorage.setItem(key, json);
    },
    { key: SESSION_KEY, json: savedSession(accountId) },
  );
}

export async function readSession(page: Page): Promise<{
  sessionAccountId: string | null;
  scenarioId: string | null;
}> {
  const raw = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    SESSION_KEY,
  );
  if (!raw) return { sessionAccountId: null, scenarioId: null };
  return JSON.parse(raw) as {
    sessionAccountId: string | null;
    scenarioId: string | null;
  };
}

export async function startDemo(page: Page): Promise<void> {
  await page.goto('/defense#demo');
  const launch = page.getByRole('button', { name: 'Запустить демо' });
  await expect(launch).toBeVisible();
  await launch.click();
}

export const scenarioSelect = (page: Page): Locator =>
  page.getByRole('combobox', { name: 'Сценарий' });

export const presentSections = [
  ['#goal', '1. Цель проекта'],
  ['#path', '2. Путь пользователя'],
  ['#status', '4. Статус B1–B8'],
  ['#plan', '8. План и симуляция'],
  ['#burndown', '9. Сгорание и скорость'],
  ['#feedback', '10. Обратная связь'],
  ['#retro', '11. Ретроспектива и выводы'],
  ['#roles', '12. Роли'],
  ['#evidence-log', '13. Журнал доказательств'],
  ['#boundaries', '14. Границы прототипа'],
] as const;

export const boundaryText =
  'Публикация, адрес сайта, DNS, HTTPS, вход и проверка архивов имитируются в браузере. Отказ в доступе чужому аккаунту тоже имитация: настоящая изоляция аккаунтов, хостинг и сервер в прототип не входят.';

export const scopeNote =
  'B5 не сокращали; сокращённый вариант из §3.2 не понадобился';

export function goalMarks(text: string): {
  deferred: boolean;
  met: boolean;
  unmet: boolean;
} {
  const unmet = text.includes('не выполнено');
  const rest = text.replaceAll('не выполнено', '');
  return {
    unmet,
    met: rest.includes('выполнено'),
    deferred: text.includes('отложено'),
  };
}
