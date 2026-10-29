import { reducer, type Action } from '../state/reducer.ts';
import type {
  AccountId,
  AppState,
  DemoState,
  SimulateFlags,
  Site,
} from '../state/types.ts';
import { accounts, baseline } from './accounts.ts';
import { archives, type ArchiveFixture } from './archives.ts';

const uploadedAt = '2026-10-28T10:00:00.000Z';

const passed: SimulateFlags = {
  publishFails: false,
  rollbackFails: false,
  domainCheck: 'pass',
};

export interface ScenarioSetup {
  account: AccountId | null;
  simulate: SimulateFlags;
  planSelected?: false;
  storageDataStatus?: 'stale';
  domainStatus?: 'deferred';
}

export interface Scenario {
  id: string;
  title: string;
  route: string;
  setup: ScenarioSetup;
  actions: readonly Action[];
}

type SetupExtras = {
  simulate?: SimulateFlags;
  planSelected?: false;
  storageDataStatus?: 'stale';
  domainStatus?: 'deferred';
};

function account(id: AccountId) {
  const found = accounts.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

const nan = account('a');
const temir = account('b');

function manage(slug: string, section = ''): string {
  return `/manage/${slug}${section}`;
}

function archive(name: string): ArchiveFixture {
  const fixture = archives[name];
  if (!fixture) throw new Error(`missing ${name}`);
  return fixture;
}

function upload(name: string): Action {
  return {
    type: 'upload',
    slug: nan.slug,
    archive: archive(name),
    uploadedAt,
  };
}

const publishNan: Action = { type: 'publish', slug: nan.slug };
const rollbackNan: Action = { type: 'rollback', slug: nan.slug };
const verifyNan: Action = { type: 'verifyDomain', slug: nan.slug };
const activateNan: Action = { type: 'activateDomain', slug: nan.slug };

function setNanDomain(): Action {
  return { type: 'setDomain', slug: nan.slug, name: nan.domainName };
}

function scenario(
  id: string,
  title: string,
  route: string,
  owner: AccountId | null,
  actions: readonly Action[] = [],
  extras: SetupExtras = {},
): Scenario {
  const { simulate, ...rest } = extras;
  return {
    id,
    title,
    route,
    setup: {
      account: owner,
      simulate: { ...(simulate ?? passed) },
      ...rest,
    },
    actions,
  };
}

const publishB: readonly Action[] = [upload('nan-v2.zip'), publishNan];

const fillStorage: readonly Action[] = [
  ...publishB,
  upload('nan-v3.zip'),
  publishNan,
  upload('nan-v4.zip'),
  publishNan,
];

export const scenarios: readonly Scenario[] = [
  scenario('signed-out', 'Выход', '/login', null),
  scenario('a-home', 'Аккаунт Нан', manage(nan.slug), 'a'),
  scenario('b-home', 'Аккаунт Темир', manage(temir.slug), 'b'),
  scenario('b-opens-a', 'Чужой аккаунт', manage(nan.slug), 'b'),
  scenario(
    'plan-not-selected',
    'План не выбран',
    manage(nan.slug, '/upload'),
    'a',
    [],
    { planSelected: false },
  ),
  scenario(
    'reject-no-index',
    'Нет index.html',
    manage(nan.slug, '/upload'),
    'a',
    [upload('nan-no-index.zip')],
  ),
  scenario(
    'reject-unsafe-path',
    'Небезопасный путь',
    manage(nan.slug, '/upload'),
    'a',
    [upload('nan-unsafe.zip')],
  ),
  scenario(
    'reject-archive-size',
    'Архив больше лимита',
    manage(nan.slug, '/upload'),
    'a',
    [upload('nan-28mb.zip')],
  ),
  scenario(
    'reject-unpacked-size',
    'Распаковка больше лимита',
    manage(nan.slug, '/upload'),
    'a',
    [upload('nan-unpack-60.zip')],
  ),
  scenario(
    'reject-storage',
    'Хранилище заполнено',
    manage(nan.slug, '/upload'),
    'a',
    [...fillStorage, upload('nan-storage.zip')],
  ),
  scenario('second-site', 'Второй сайт', manage(nan.slug, '/plan'), 'a', [
    { type: 'addSite' },
  ]),
  scenario('preview-b', 'Предпросмотр B', manage(nan.slug, '/preview'), 'a', [
    upload('nan-v2.zip'),
  ]),
  scenario('publish-ok', 'Публикация прошла', manage(nan.slug), 'a', publishB),
  scenario(
    'publish-fail',
    'Ошибка публикации',
    manage(nan.slug, '/versions'),
    'a',
    publishB,
    { simulate: { ...passed, publishFails: true } },
  ),
  scenario(
    'rollback-ok',
    'Откат выполнен',
    manage(nan.slug, '/versions'),
    'a',
    [...publishB, rollbackNan],
  ),
  scenario(
    'rollback-none',
    'Откат недоступен',
    manage(nan.slug, '/versions'),
    'a',
  ),
  scenario(
    'rollback-fail',
    'Откат не прошёл',
    manage(nan.slug, '/versions'),
    'a',
    [...publishB, rollbackNan],
    { simulate: { ...passed, rollbackFails: true } },
  ),
  scenario(
    'domain-pending',
    'Домен: ожидание',
    manage(nan.slug, '/domain'),
    'a',
    [setNanDomain()],
  ),
  scenario('domain-active', 'Домен активен', manage(nan.slug, '/domain'), 'a', [
    setNanDomain(),
    verifyNan,
    activateNan,
  ]),
  scenario(
    'domain-failed',
    'Домен: ошибка',
    manage(nan.slug, '/domain'),
    'a',
    [setNanDomain(), verifyNan],
    { simulate: { ...passed, domainCheck: 'fail' } },
  ),
  scenario('domain-deferred', 'Домен недоступен', manage(nan.slug), 'a', [], {
    domainStatus: 'deferred',
  }),
  scenario('storage-stale', 'Хранилище устарело', manage(nan.slug), 'a', [], {
    storageDataStatus: 'stale',
  }),
];

function ownerSlug(id: AccountId): string {
  return account(id).slug;
}

function withSite(state: AppState, slug: string, site: Site): AppState {
  return {
    ...state,
    sites: { ...state.sites, [slug]: site },
  };
}

function applySetup(setup: ScenarioSetup, scenarioId: string): AppState {
  let state: AppState = {
    ...baseline,
    sessionAccountId: setup.account,
    simulate: { ...setup.simulate },
    scenarioId,
  };
  if (setup.account === null) return state;

  if (setup.planSelected === false) {
    state = {
      ...state,
      planSelected: { ...state.planSelected, [setup.account]: false },
    };
  }

  const slug = ownerSlug(setup.account);
  const site = state.sites[slug];
  if (!site) return state;

  let next = site;
  if (setup.storageDataStatus === 'stale') {
    next = { ...next, storageDataStatus: 'stale' };
  }
  if (setup.domainStatus === 'deferred') {
    next = {
      ...next,
      domain: { ...next.domain, status: 'deferred' },
    };
  }
  if (next !== site) state = withSite(state, slug, next);
  return state;
}

export function scenarioById(id: string): Scenario | undefined {
  return scenarios.find((item) => item.id === id);
}

export function scenarioState(scenario: Scenario): AppState {
  return scenario.actions.reduce(
    reducer,
    applySetup(scenario.setup, scenario.id),
  );
}

export function demoRunning(demo: DemoState | null): boolean {
  return demo !== null;
}
