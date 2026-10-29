import type { ArchiveFixture } from '../data/archives.ts';
import { LIMITS } from '../data/limits.ts';
import type {
  AccountId,
  AddSiteResult,
  AppState,
  DemoState,
  Site,
  UploadResult,
  Version,
} from './types.ts';
import { validateArchive } from './validateArchive.ts';

export type Action =
  | { type: 'signIn'; accountId: AccountId }
  | { type: 'signOut' }
  | { type: 'selectPlan'; accountId: AccountId }
  | {
      type: 'upload';
      slug: string;
      archive: ArchiveFixture;
      uploadedAt: string;
    }
  | { type: 'publish'; slug: string }
  | { type: 'rollback'; slug: string }
  | { type: 'addSite' }
  | { type: 'setDomain'; slug: string; name: string }
  | { type: 'verifyDomain'; slug: string }
  | { type: 'activateDomain'; slug: string }
  | { type: 'refreshStorage'; slug: string; updatedAt: string }
  | { type: 'setDemo'; demo: DemoState | null }
  | { type: 'load'; state: AppState };

function versionFrom(archive: ArchiveFixture, uploadedAt: string): Version {
  if (archive.archiveMb === null || archive.unpackedMb === null) {
    throw new Error(`${archive.name} cannot be a retained version`);
  }

  const id = archive.name.replace(/\.zip$/, '');
  return {
    id,
    label: archive.label ?? id,
    archiveName: archive.name,
    archiveMb: archive.archiveMb,
    unpackedMb: archive.unpackedMb,
    uploadedAt,
  };
}

function putSite(state: AppState, slug: string, site: Site): AppState {
  return {
    ...state,
    sites: { ...state.sites, [slug]: site },
  };
}

function upload(
  state: AppState,
  action: Extract<Action, { type: 'upload' }>,
): AppState {
  const site = state.sites[action.slug];
  if (!site) return state;

  const check = validateArchive(action.archive, site, LIMITS);
  const lastResult: UploadResult = {
    kind: 'upload',
    archiveName: action.archive.name,
    ...check,
  };
  if (!check.ok) return { ...state, lastResult };

  const version = versionFrom(action.archive, action.uploadedAt);
  const versions = site.versions.filter(
    (item) => item.id !== site.candidateVersionId,
  );
  return {
    ...putSite(state, action.slug, {
      ...site,
      versions: [...versions, version],
      candidateVersionId: version.id,
    }),
    lastResult,
  };
}

function publish(state: AppState, slug: string): AppState {
  const site = state.sites[slug];
  if (!site || site.candidateVersionId === null) return state;

  if (state.simulate.publishFails) {
    return putSite(state, slug, { ...site, deployment: 'publishFailed' });
  }

  return putSite(state, slug, {
    ...site,
    previousActiveId: site.activeVersionId,
    activeVersionId: site.candidateVersionId,
    candidateVersionId: null,
    deployment: 'published',
  });
}

function rollback(state: AppState, slug: string): AppState {
  const site = state.sites[slug];
  if (!site || site.previousActiveId === null) return state;

  if (state.simulate.rollbackFails) {
    return putSite(state, slug, { ...site, deployment: 'rollbackFailed' });
  }

  return putSite(state, slug, {
    ...site,
    activeVersionId: site.previousActiveId,
    previousActiveId: null,
    deployment: 'rolledBack',
  });
}

function selectPlan(state: AppState, accountId: AccountId): AppState {
  if (state.planSelected[accountId]) return state;
  return {
    ...state,
    planSelected: { ...state.planSelected, [accountId]: true },
  };
}

function addSiteResult(): AddSiteResult {
  return {
    kind: 'addSite',
    ok: false,
    nextStep: `Сайт уже есть. Лимит пилотного плана: ${LIMITS.sites} сайт. Работайте с текущим сайтом.`,
  };
}

function addSite(state: AppState): AppState {
  return { ...state, lastResult: addSiteResult() };
}

function setDomain(state: AppState, slug: string, name: string): AppState {
  const site = state.sites[slug];
  const domainName = name.trim();
  if (!site || domainName === '' || site.domain.status === 'deferred') {
    return state;
  }

  return putSite(state, slug, {
    ...site,
    domain: {
      name: domainName,
      status: 'pending',
      controlVerified: false,
    },
  });
}

function verifyDomain(state: AppState, slug: string): AppState {
  const site = state.sites[slug];
  if (
    !site ||
    site.domain.name === null ||
    site.domain.status === 'notStarted' ||
    site.domain.status === 'deferred'
  ) {
    return state;
  }

  if (state.simulate.domainCheck === 'fail') {
    return putSite(state, slug, {
      ...site,
      domain: {
        ...site.domain,
        status: 'failed',
        controlVerified: false,
      },
    });
  }

  return putSite(state, slug, {
    ...site,
    domain: {
      ...site.domain,
      status: site.domain.status === 'active' ? 'active' : 'pending',
      controlVerified: true,
    },
  });
}

/** Status becomes active only after controlVerified is already true. */
function activateDomain(state: AppState, slug: string): AppState {
  const site = state.sites[slug];
  if (
    !site ||
    site.domain.status !== 'pending' ||
    !site.domain.controlVerified
  ) {
    return state;
  }

  return putSite(state, slug, {
    ...site,
    domain: { ...site.domain, status: 'active' },
  });
}

function refreshStorage(
  state: AppState,
  slug: string,
  updatedAt: string,
): AppState {
  const site = state.sites[slug];
  if (!site) return state;

  return putSite(state, slug, {
    ...site,
    storageDataStatus: 'current',
    lastUpdatedAt: updatedAt,
  });
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'signIn':
      return { ...state, sessionAccountId: action.accountId };
    case 'signOut':
      return { ...state, sessionAccountId: null };
    case 'selectPlan':
      return selectPlan(state, action.accountId);
    case 'upload':
      return upload(state, action);
    case 'publish':
      return publish(state, action.slug);
    case 'rollback':
      return rollback(state, action.slug);
    case 'addSite':
      return addSite(state);
    case 'setDomain':
      return setDomain(state, action.slug, action.name);
    case 'verifyDomain':
      return verifyDomain(state, action.slug);
    case 'activateDomain':
      return activateDomain(state, action.slug);
    case 'refreshStorage':
      return refreshStorage(state, action.slug, action.updatedAt);
    case 'setDemo':
      return { ...state, demo: action.demo };
    case 'load':
      return action.state;
  }
}
