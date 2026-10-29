import { describe, expect, it } from 'vitest';
import { baseline } from '../data/accounts.ts';
import { archives, type ArchiveFixture } from '../data/archives.ts';
import { LIMITS } from '../data/limits.ts';
import type { AppState, DomainState, Site, UploadResult } from './types.ts';
import { reducer, type Action } from './reducer.ts';
import { exampleUrl, storageUsedMb } from './selectors.ts';
import { validateArchive } from './validateArchive.ts';

const uploadedAt = '2026-10-29T12:00:00.000Z';

function archive(name: string): ArchiveFixture {
  const fixture = archives[name];
  if (!fixture) throw new Error(`missing ${name}`);
  return fixture;
}

function unpacked(name: string): number {
  const value = archive(name).unpackedMb;
  if (value === null) throw new Error(`${name} has no unpacked size`);
  return value;
}

function siteOf(state: AppState, slug = 'nan'): Site {
  const site = state.sites[slug];
  if (!site) throw new Error(`missing ${slug}`);
  return site;
}

function activeLabel(state: AppState, slug = 'nan'): string {
  const site = siteOf(state, slug);
  const version = site.versions.find(
    (item) => item.id === site.activeVersionId,
  );
  if (!version) throw new Error(`missing active version on ${slug}`);
  return version.label;
}

function uploadAction(
  slug: string,
  name: string,
  at: string = uploadedAt,
): Action {
  return { type: 'upload', slug, archive: archive(name), uploadedAt: at };
}

function uploadResult(state: AppState, name: string): UploadResult {
  return {
    kind: 'upload',
    archiveName: name,
    ...validateArchive(archive(name), siteOf(state), LIMITS),
  };
}

function withDomain(
  state: AppState,
  domain: DomainState,
  slug = 'nan',
): AppState {
  return {
    ...state,
    sites: {
      ...state.sites,
      [slug]: { ...siteOf(state, slug), domain },
    },
  };
}

function expectActiveImpliesVerified(state: AppState) {
  for (const site of Object.values(state.sites)) {
    if (site.domain.status === 'active') {
      expect(site.domain.controlVerified).toBe(true);
    }
  }
}

function accept(
  state: AppState,
  name: string,
  at: string = uploadedAt,
): AppState {
  return reducer(state, uploadAction('nan', name, at));
}

function publishAccepted(state: AppState, name: string): AppState {
  return reducer(accept(state, name), { type: 'publish', slug: 'nan' });
}

describe('reducer', () => {
  it('signs a session in and out', () => {
    const signedIn = reducer(baseline, { type: 'signIn', accountId: 'a' });
    expect(signedIn).toEqual({ ...baseline, sessionAccountId: 'a' });

    const switched = reducer(signedIn, { type: 'signIn', accountId: 'b' });
    expect(switched).toEqual({ ...signedIn, sessionAccountId: 'b' });

    const signedOut = reducer(switched, { type: 'signOut' });
    expect(signedOut).toEqual({ ...switched, sessionAccountId: null });
  });

  it('B2-AC5 keeps the active version when an upload is rejected', () => {
    for (const name of [
      'nan-no-index.zip',
      'nan-unsafe.zip',
      'nan-28mb.zip',
      'nan-unpack-60.zip',
    ]) {
      const next = reducer(baseline, uploadAction('nan', name));
      expect(next).toEqual({
        ...baseline,
        lastResult: uploadResult(baseline, name),
      });
      expect(siteOf(next).activeVersionId).toBe(
        siteOf(baseline).activeVersionId,
      );
      expect(activeLabel(next)).toBe('A');
      expect(siteOf(next).candidateVersionId).toBeNull();
    }

    const pending = accept(baseline, 'nan-v2.zip');
    const rejected = reducer(pending, uploadAction('nan', 'nan-28mb.zip'));
    expect(rejected).toEqual({
      ...pending,
      lastResult: uploadResult(pending, 'nan-28mb.zip'),
    });
    expect(siteOf(rejected).activeVersionId).toBe('nan-v1');
    expect(siteOf(rejected).candidateVersionId).toBe('nan-v2');

    const full = ['nan-v2.zip', 'nan-v3.zip', 'nan-v4.zip'].reduce(
      publishAccepted,
      baseline,
    );
    const blocked = reducer(full, uploadAction('nan', 'nan-storage.zip'));
    expect(blocked).toEqual({
      ...full,
      lastResult: uploadResult(full, 'nan-storage.zip'),
    });
    expect(blocked.lastResult).toMatchObject({ ok: false, reason: 'storage' });
    expect(siteOf(blocked).activeVersionId).toBe(siteOf(full).activeVersionId);
    expect(activeLabel(blocked)).toBe(activeLabel(full));
  });

  it('B3-AC1 previewing B leaves A active', () => {
    const next = accept(baseline, 'nan-v2.zip');
    const site = siteOf(next);

    expect(site.activeVersionId).toBe('nan-v1');
    expect(activeLabel(next)).toBe('A');
    expect(site.candidateVersionId).toBe('nan-v2');
    expect(site.versions.map((version) => version.label)).toEqual(['A', 'B']);
    expect(site.previousActiveId).toBeNull();
    expect(site.deployment).toBe('published');
    expect(storageUsedMb(site)).toBe(
      unpacked('nan-v1.zip') + unpacked('nan-v2.zip'),
    );
    expect(next.lastResult).toEqual({
      kind: 'upload',
      archiveName: 'nan-v2.zip',
      ok: true,
    });
    expect(next.sites.temir).toBe(baseline.sites.temir);
  });

  it('B3-AC2 confirmation makes B active', () => {
    const uploaded = accept(baseline, 'nan-v2.zip');
    const next = reducer(uploaded, { type: 'publish', slug: 'nan' });
    const site = siteOf(next);

    expect(site).toEqual({
      ...siteOf(uploaded),
      previousActiveId: 'nan-v1',
      activeVersionId: 'nan-v2',
      candidateVersionId: null,
      deployment: 'published',
    });
    expect(activeLabel(next)).toBe('B');
    expect(next.lastResult).toEqual(uploaded.lastResult);
    expect(next.sites.temir).toBe(baseline.sites.temir);
    expect(site.versions.map((version) => version.id)).toEqual([
      'nan-v1',
      'nan-v2',
    ]);
  });

  it('B3-AC3 a failed publication keeps A active', () => {
    const uploaded = accept(baseline, 'nan-v2.zip');
    const failing: AppState = {
      ...uploaded,
      simulate: { ...uploaded.simulate, publishFails: true },
    };
    const next = reducer(failing, { type: 'publish', slug: 'nan' });

    expect(siteOf(next)).toEqual({
      ...siteOf(failing),
      deployment: 'publishFailed',
    });
    expect(activeLabel(next)).toBe('A');
    expect(siteOf(next).candidateVersionId).toBe('nan-v2');
    expect(siteOf(next).previousActiveId).toBeNull();
    expect(next.lastResult).toEqual(failing.lastResult);
  });

  it('does not publish without a candidate', () => {
    expect(reducer(baseline, { type: 'publish', slug: 'nan' })).toBe(baseline);

    const failing: AppState = {
      ...baseline,
      simulate: { ...baseline.simulate, publishFails: true },
    };
    expect(reducer(failing, { type: 'publish', slug: 'nan' })).toBe(failing);
  });

  it('B4-AC1 rolling back after publishing B restores A', () => {
    const published = publishAccepted(baseline, 'nan-v2.zip');
    const next = reducer(published, { type: 'rollback', slug: 'nan' });
    const site = siteOf(next);

    expect(site).toEqual({
      ...siteOf(published),
      activeVersionId: 'nan-v1',
      previousActiveId: null,
      deployment: 'rolledBack',
    });
    expect(activeLabel(next)).toBe('A');
    expect(site.candidateVersionId).toBeNull();
    expect(site.versions.map((version) => version.id)).toEqual([
      'nan-v1',
      'nan-v2',
    ]);
    expect(site).not.toHaveProperty('history');
    expect(next.lastResult).toEqual(published.lastResult);
    expect(reducer(next, { type: 'rollback', slug: 'nan' })).toBe(next);
  });

  it('B4-AC2 does nothing when there is no previous version', () => {
    for (const slug of ['nan', 'temir']) {
      expect(siteOf(baseline, slug).previousActiveId).toBeNull();
      expect(reducer(baseline, { type: 'rollback', slug })).toBe(baseline);
    }
  });

  it('B4-AC3 a failed rollback keeps the current version label', () => {
    const published = publishAccepted(baseline, 'nan-v2.zip');
    const failing: AppState = {
      ...published,
      simulate: { ...published.simulate, rollbackFails: true },
    };
    const next = reducer(failing, { type: 'rollback', slug: 'nan' });

    expect(siteOf(next)).toEqual({
      ...siteOf(failing),
      deployment: 'rollbackFailed',
    });
    expect(activeLabel(next)).toBe('B');
    expect(siteOf(next).activeVersionId).toBe(siteOf(failing).activeVersionId);
    expect(siteOf(next).previousActiveId).toBe('nan-v1');
    expect(next.lastResult).toEqual(failing.lastResult);
  });

  it('replaces an unpublished candidate', () => {
    const first = accept(baseline, 'nan-v2.zip');
    const later = '2026-10-29T13:00:00.000Z';
    const next = accept(first, 'nan-v3.zip', later);
    const site = siteOf(next);

    expect(site.activeVersionId).toBe('nan-v1');
    expect(activeLabel(next)).toBe('A');
    expect(site.candidateVersionId).toBe('nan-v3');
    expect(site.versions.map((version) => version.id)).toEqual([
      'nan-v1',
      'nan-v3',
    ]);
    expect(site.versions[1]?.uploadedAt).toBe(later);
    expect(storageUsedMb(site)).toBe(
      unpacked('nan-v1.zip') + unpacked('nan-v3.zip'),
    );
    expect(next.lastResult).toEqual({
      kind: 'upload',
      archiveName: 'nan-v3.zip',
      ok: true,
    });
  });

  it('drops the replaced candidate from the storage check', () => {
    const published = ['nan-v2.zip', 'nan-v3.zip'].reduce(
      publishAccepted,
      baseline,
    );
    const withCandidate = accept(published, 'nan-v4.zip');
    const keptBoth =
      storageUsedMb(siteOf(withCandidate)) + unpacked('nan-storage.zip');
    expect(keptBoth).toBeGreaterThan(LIMITS.storageMb);

    const next = accept(withCandidate, 'nan-storage.zip');
    const site = siteOf(next);
    expect(next.lastResult).toEqual({
      kind: 'upload',
      archiveName: 'nan-storage.zip',
      ok: true,
    });
    expect(site.activeVersionId).toBe(siteOf(withCandidate).activeVersionId);
    expect(site.candidateVersionId).toBe('nan-storage');
    expect(site.versions.map((version) => version.id)).toEqual([
      'nan-v1',
      'nan-v2',
      'nan-v3',
      'nan-storage',
    ]);
    expect(
      site.versions.find((version) => version.id === 'nan-storage'),
    ).toMatchObject({
      label: 'E',
      archiveName: 'nan-storage.zip',
      archiveMb: archive('nan-storage.zip').archiveMb,
      unpackedMb: archive('nan-storage.zip').unpackedMb,
    });
    expect(storageUsedMb(site)).toBe(
      unpacked('nan-v1.zip') +
        unpacked('nan-v2.zip') +
        unpacked('nan-v3.zip') +
        unpacked('nan-storage.zip'),
    );
  });

  it('leaves an unknown site untouched', () => {
    expect(reducer(baseline, uploadAction('missing', 'nan-v2.zip'))).toBe(
      baseline,
    );
    expect(reducer(baseline, { type: 'publish', slug: 'missing' })).toBe(
      baseline,
    );
    expect(reducer(baseline, { type: 'rollback', slug: 'missing' })).toBe(
      baseline,
    );
    expect(
      reducer(baseline, {
        type: 'setDomain',
        slug: 'missing',
        name: 'nan.example',
      }),
    ).toBe(baseline);
    expect(reducer(baseline, { type: 'verifyDomain', slug: 'missing' })).toBe(
      baseline,
    );
    expect(reducer(baseline, { type: 'activateDomain', slug: 'missing' })).toBe(
      baseline,
    );
    expect(
      reducer(baseline, {
        type: 'refreshStorage',
        slug: 'missing',
        updatedAt: uploadedAt,
      }),
    ).toBe(baseline);
  });

  it('selectPlan marks the pilot plan for that account', () => {
    const closed: AppState = {
      ...baseline,
      planSelected: { a: false, b: true },
    };
    const next = reducer(closed, { type: 'selectPlan', accountId: 'a' });

    expect(next.planSelected).toEqual({ a: true, b: true });
    expect(next.sites).toBe(closed.sites);
    expect(reducer(next, { type: 'selectPlan', accountId: 'a' })).toBe(next);
    expect(reducer(baseline, { type: 'selectPlan', accountId: 'b' })).toBe(
      baseline,
    );
  });

  it('B7-AC2 rejects addSite with the pilot site limit and a next step', () => {
    const next = reducer(baseline, { type: 'addSite' });

    expect(next.sites).toBe(baseline.sites);
    expect(Object.keys(next.sites)).toEqual(['nan', 'temir']);
    expect(reducer(next, { type: 'addSite' }).sites).toBe(baseline.sites);
    expect(next.lastResult).toEqual({
      kind: 'addSite',
      ok: false,
      nextStep: `Сайт уже есть. Лимит пилотного плана: ${LIMITS.sites} сайт. Работайте с текущим сайтом.`,
    });
  });

  it('B5-AC1 refuses activateDomain until control is verified', () => {
    expect(reducer(baseline, { type: 'activateDomain', slug: 'nan' })).toBe(
      baseline,
    );

    const pending = reducer(baseline, {
      type: 'setDomain',
      slug: 'nan',
      name: 'nan.example',
    });
    expect(siteOf(pending).domain).toEqual({
      name: 'nan.example',
      status: 'pending',
      controlVerified: false,
    });
    expect(pending.lastResult).toBeNull();
    expect(reducer(pending, { type: 'activateDomain', slug: 'nan' })).toBe(
      pending,
    );

    const verified = reducer(pending, { type: 'verifyDomain', slug: 'nan' });
    expect(siteOf(verified).domain).toEqual({
      name: 'nan.example',
      status: 'pending',
      controlVerified: true,
    });
    expect(verified.lastResult).toBeNull();
    expect(siteOf(verified).deployment).toBe(siteOf(pending).deployment);

    const active = reducer(verified, { type: 'activateDomain', slug: 'nan' });
    expect(siteOf(active).domain).toEqual({
      name: 'nan.example',
      status: 'active',
      controlVerified: true,
    });
    expect(active.lastResult).toBeNull();
    expectActiveImpliesVerified(active);
    expect(active.sites.temir).toBe(baseline.sites.temir);
  });

  it('keeps active only when controlVerified', () => {
    const steps: Action[] = [
      { type: 'activateDomain', slug: 'nan' },
      { type: 'setDomain', slug: 'nan', name: 'nan.example' },
      { type: 'activateDomain', slug: 'nan' },
      { type: 'verifyDomain', slug: 'nan' },
      { type: 'activateDomain', slug: 'nan' },
      { type: 'setDomain', slug: 'nan', name: 'nan.example' },
      { type: 'verifyDomain', slug: 'nan' },
      { type: 'activateDomain', slug: 'nan' },
    ];

    const states = steps.reduce<AppState[]>(
      (seen, action) => [...seen, reducer(seen.at(-1) ?? baseline, action)],
      [],
    );

    for (const state of states) expectActiveImpliesVerified(state);
    expect(siteOf(states.at(-1) ?? baseline).domain).toEqual({
      name: 'nan.example',
      status: 'active',
      controlVerified: true,
    });

    const active = states[4];
    if (!active) throw new Error('missing active step');
    const failing: AppState = {
      ...active,
      simulate: { ...active.simulate, domainCheck: 'fail' },
    };
    const failed = reducer(failing, { type: 'verifyDomain', slug: 'nan' });
    expect(siteOf(failed).domain).toEqual({
      name: 'nan.example',
      status: 'failed',
      controlVerified: false,
    });
    expect(failed.lastResult).toBe(active.lastResult);
    expect(siteOf(failed).deployment).toBe(siteOf(active).deployment);
    expect(reducer(failed, { type: 'activateDomain', slug: 'nan' })).toBe(
      failed,
    );
    expectActiveImpliesVerified(failed);

    const rechecked = reducer(active, { type: 'verifyDomain', slug: 'nan' });
    expect(siteOf(rechecked).domain).toEqual(siteOf(active).domain);

    const retry: AppState = {
      ...failed,
      simulate: { ...failed.simulate, domainCheck: 'pass' },
    };
    const recovered = reducer(
      reducer(retry, { type: 'verifyDomain', slug: 'nan' }),
      { type: 'activateDomain', slug: 'nan' },
    );
    expect(siteOf(recovered).domain.status).toBe('active');
    expect(siteOf(recovered).domain.controlVerified).toBe(true);
  });

  it('writes a failed domain check only on domain.status', () => {
    const uploaded = reducer(baseline, uploadAction('nan', 'nan-28mb.zip'));
    const pending = reducer(uploaded, {
      type: 'setDomain',
      slug: 'nan',
      name: '  nan.example  ',
    });
    expect(siteOf(pending).domain.name).toBe('nan.example');
    expect(pending.lastResult).toBe(uploaded.lastResult);

    const failing: AppState = {
      ...pending,
      simulate: { ...pending.simulate, domainCheck: 'fail' },
    };
    const failed = reducer(failing, { type: 'verifyDomain', slug: 'nan' });

    expect(siteOf(failed).domain).toEqual({
      name: 'nan.example',
      status: 'failed',
      controlVerified: false,
    });
    expect(failed.lastResult).toBe(uploaded.lastResult);
    expect(failed.lastResult).toMatchObject({ kind: 'upload', ok: false });
    expect(siteOf(failed)).not.toHaveProperty('domainResult');
    expect(Object.keys(siteOf(failed).domain).sort()).toEqual([
      'controlVerified',
      'name',
      'status',
    ]);
    expect(reducer(failed, { type: 'activateDomain', slug: 'nan' })).toBe(
      failed,
    );
  });

  it('leaves a deferred domain unchanged', () => {
    const deferred = withDomain(baseline, {
      name: null,
      status: 'deferred',
      controlVerified: false,
    });

    expect(
      reducer(deferred, {
        type: 'setDomain',
        slug: 'nan',
        name: 'nan.example',
      }),
    ).toBe(deferred);
    expect(reducer(deferred, { type: 'verifyDomain', slug: 'nan' })).toBe(
      deferred,
    );
    expect(reducer(deferred, { type: 'activateDomain', slug: 'nan' })).toBe(
      deferred,
    );
    expectActiveImpliesVerified(deferred);
  });

  it('ignores domain setup with a blank name', () => {
    expect(
      reducer(baseline, { type: 'setDomain', slug: 'nan', name: '   ' }),
    ).toBe(baseline);
    expect(reducer(baseline, { type: 'verifyDomain', slug: 'nan' })).toBe(
      baseline,
    );
  });

  it('refreshStorage marks storage current without a snapshot', () => {
    const nan = siteOf(baseline);
    const staleSite: Site = { ...nan, storageDataStatus: 'stale' };
    const stored: AppState = {
      ...baseline,
      sites: { ...baseline.sites, nan: staleSite },
    };
    const updatedAt = '2026-10-29T15:00:00.000Z';
    const next = reducer(stored, {
      type: 'refreshStorage',
      slug: 'nan',
      updatedAt,
    });
    const site = siteOf(next);

    expect(site.storageDataStatus).toBe('current');
    expect(site.lastUpdatedAt).toBe(updatedAt);
    expect(site.versions).toBe(staleSite.versions);
    expect(storageUsedMb(site)).toBe(storageUsedMb(nan));
    expect(site).not.toHaveProperty('storageSnapshotMb');
    expect(site.domain).toEqual(nan.domain);
    expect(next.lastResult).toBeNull();
    expect(next.sites.temir).toBe(baseline.sites.temir);
  });

  it('setDemo stores a step or clears it', () => {
    const running = reducer(baseline, { type: 'setDemo', demo: { step: 4 } });
    expect(running.demo).toEqual({ step: 4 });
    expect(running.sites).toBe(baseline.sites);
    expect(running.scenarioId).toBeNull();

    const signedIn = reducer(running, { type: 'signIn', accountId: 'a' });
    expect(signedIn.demo).toEqual({ step: 4 });

    const cleared = reducer(signedIn, { type: 'setDemo', demo: null });
    expect(cleared.demo).toBeNull();
    expect(cleared.sessionAccountId).toBe('a');
  });

  it('load replaces the whole state', () => {
    const running = reducer(
      reducer(baseline, { type: 'signIn', accountId: 'a' }),
      { type: 'setDemo', demo: { step: 2 } },
    );
    expect(reducer(running, { type: 'load', state: baseline })).toBe(baseline);

    const scenario: AppState = {
      ...baseline,
      sessionAccountId: 'b',
      scenarioId: 'domain-deferred',
      demo: { step: 1 },
    };
    expect(reducer(running, { type: 'load', state: scenario })).toBe(scenario);
  });
});

describe('selectors', () => {
  it('derives storage and the example URL', () => {
    const nan = siteOf(baseline);
    const temir = siteOf(baseline, 'temir');

    expect(exampleUrl(nan)).toBe('/site/nan');
    expect(exampleUrl(temir)).toBe('/site/temir');
    expect(storageUsedMb(nan)).toBe(unpacked('nan-v1.zip'));
    expect(storageUsedMb(temir)).toBe(unpacked('temir-v1.zip'));
    expect(JSON.stringify(baseline)).not.toContain('/site/');
    expect(nan).not.toHaveProperty('exampleUrl');
    expect(nan).not.toHaveProperty('storageUsedMb');

    const uploaded = accept(baseline, 'nan-v2.zip');
    expect(storageUsedMb(siteOf(uploaded))).toBe(
      unpacked('nan-v1.zip') + unpacked('nan-v2.zip'),
    );
    expect(exampleUrl(siteOf(uploaded))).toBe('/site/nan');
    expect(JSON.stringify(uploaded)).not.toContain('/site/');
  });
});
