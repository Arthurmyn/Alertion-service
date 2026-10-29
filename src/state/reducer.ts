import type { ArchiveFixture } from '../data/archives.ts';
import { LIMITS } from '../data/limits.ts';
import type {
  AccountId,
  AppState,
  Site,
  UploadResult,
  Version,
} from './types.ts';
import { validateArchive } from './validateArchive.ts';

export type Action =
  | { type: 'signIn'; accountId: AccountId }
  | { type: 'signOut' }
  | {
      type: 'upload';
      slug: string;
      archive: ArchiveFixture;
      uploadedAt: string;
    }
  | { type: 'publish'; slug: string }
  | { type: 'rollback'; slug: string };

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

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'signIn':
      return { ...state, sessionAccountId: action.accountId };
    case 'signOut':
      return { ...state, sessionAccountId: null };
    case 'upload':
      return upload(state, action);
    case 'publish':
      return publish(state, action.slug);
    case 'rollback':
      return rollback(state, action.slug);
  }
}
