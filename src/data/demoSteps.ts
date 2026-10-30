import { formatMb, rollbackVersion } from '../pages/project/Versions.copy.ts';
import { reducer, type Action } from '../state/reducer.ts';
import { storageUsedMb } from '../state/selectors.ts';
import type { AppState, Site } from '../state/types.ts';
import { accounts, baseline } from './accounts.ts';
import { archives, type ArchiveFixture } from './archives.ts';
import { LIMITS } from './limits.ts';
import { sampleSites } from './sampleSites.ts';
import { scenarioById } from './scenarios.ts';

const uploadedAt = '2026-10-28T10:00:00.000Z';

const owner = accounts[0];

function fixture(name: string): ArchiveFixture {
  const archive = archives[name];
  if (!archive) throw new Error(`missing ${name}`);
  return archive;
}

function upload(name: string): Action {
  return {
    type: 'upload',
    slug: owner.slug,
    archive: fixture(name),
    uploadedAt,
  };
}

type DemoStep = {
  n: number;
  route: string;
  actions: readonly Action[];
};

const steps: readonly DemoStep[] = [
  {
    n: 1,
    route: `/manage/${owner.slug}`,
    actions: [{ type: 'signIn', accountId: owner.id }],
  },
  {
    n: 2,
    route: `/site/${owner.slug}`,
    actions: [],
  },
  {
    n: 3,
    route: `/manage/${owner.slug}/upload`,
    actions: [upload('nan-28mb.zip')],
  },
  {
    n: 4,
    route: `/manage/${owner.slug}/upload`,
    actions: [upload('nan-v2.zip')],
  },
  {
    n: 5,
    route: `/manage/${owner.slug}/preview`,
    actions: [],
  },
  {
    n: 6,
    route: `/manage/${owner.slug}/versions`,
    actions: [{ type: 'publish', slug: owner.slug }],
  },
  {
    n: 7,
    route: `/site/${owner.slug}`,
    actions: [],
  },
  {
    n: 8,
    route: `/manage/${owner.slug}/versions`,
    actions: [rollbackVersion(owner.slug)],
  },
  {
    n: 9,
    route: `/manage/${owner.slug}`,
    actions: [],
  },
  {
    n: 10,
    route: '/defense#demo',
    actions: [],
  },
];

export const demoStepCount = steps.length;

export const demoCatalog = [
  {
    id: 'failure',
    title: 'Сбои',
    ids: [
      'reject-no-index',
      'reject-unsafe-path',
      'reject-archive-size',
      'reject-unpacked-size',
      'reject-storage',
      'publish-fail',
      'rollback-fail',
    ],
  },
  {
    id: 'denial',
    title: 'Отказ в доступе',
    ids: ['b-opens-a'],
  },
  {
    id: 'domain',
    title: 'Домен',
    ids: [
      'domain-pending',
      'domain-active',
      'domain-failed',
      'domain-deferred',
    ],
  },
] as const;

export function demoRoute(step: number): string {
  return steps.find((item) => item.n === step)?.route ?? '/defense#demo';
}

/** Replay steps 1..n from baseline, then store the step. No snapshot stack. */
export function demoState(step: number): AppState {
  const played = steps
    .filter((item) => item.n <= step)
    .flatMap((item) => item.actions)
    .reduce(reducer, baseline);
  return reducer(played, { type: 'setDemo', demo: { step } });
}

export function scenarioHref(id: string): string | null {
  const scenario = scenarioById(id);
  if (!scenario) return null;
  return `${scenario.route}?scenario=${scenario.id}`;
}

function versionLabel(site: Site, id: string | null): string {
  if (!id) return '';
  return site.versions.find((item) => item.id === id)?.label ?? '';
}

function storageLine(site: Site): string {
  return `${formatMb(storageUsedMb(site))} из ${formatMb(LIMITS.storageMb)}`;
}

function listItems(html: string | undefined): string[] {
  if (!html) return [];
  return [...html.matchAll(/<li>([^<]*)<\/li>/g)].map(
    (match) => match[1] ?? '',
  );
}

function appearedDish(site: Site): string {
  const active = site.versions.find((item) => item.id === site.activeVersionId);
  const previous = site.versions.find(
    (item) => item.id === site.previousActiveId,
  );
  const now = listItems(active ? sampleSites[active.archiveName] : undefined);
  const before = listItems(
    previous ? sampleSites[previous.archiveName] : undefined,
  );
  const extra = now.find((item) => !before.includes(item));
  const name = extra?.split(',')[0]?.trim() ?? '';
  return name.toLocaleLowerCase('ru-RU');
}

function rejectedSize(state: AppState): { actual: number; limit: number } {
  const result = state.lastResult;
  if (
    result?.kind === 'upload' &&
    !result.ok &&
    result.actualMb !== undefined &&
    result.limitMb !== undefined
  ) {
    return { actual: result.actualMb, limit: result.limitMb };
  }
  const archive = archives['nan-28mb.zip'];
  return {
    actual: archive?.archiveMb ?? 0,
    limit: LIMITS.archiveMb,
  };
}

export function demoCaption(state: AppState): string {
  const step = state.demo?.step;
  const site = state.sites[owner.slug];
  if (!step || !site) return '';

  const active = versionLabel(site, site.activeVersionId);
  const candidate = versionLabel(site, site.candidateVersionId);
  const storage = storageLine(site);

  switch (step) {
    case 1:
      return `Активна версия ${active}. Хранилище: ${storage}.`;
    case 2:
      return `Публичная страница версии ${active}. Данных управления здесь нет.`;
    case 3: {
      const size = rejectedSize(state);
      return `Архив ${formatMb(size.actual)} больше лимита ${formatMb(size.limit)}. Активная версия по-прежнему ${active}.`;
    }
    case 4:
      return `Проверка прошла. Версия ${candidate} стала кандидатом. Адрес сайта всё ещё показывает ${active}.`;
    case 5:
      return `Предпросмотр ${candidate} видите только вы. Активна версия ${active}.`;
    case 6:
      return `Версия ${active} опубликована.`;
    case 7:
      return `На публичной странице появился ${appearedDish(site)}.`;
    case 8:
      return `Снова активна версия ${active}.`;
    case 9:
      return `Версия ${active} активна. Хранилище: ${storage}.`;
    case 10:
      return 'Демо завершено.';
    default:
      return '';
  }
}
