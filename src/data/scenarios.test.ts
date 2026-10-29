import { describe, expect, it } from 'vitest';
import { baseline, baselineUpdatedAt } from './accounts.ts';
import { archives } from './archives.ts';
import { LIMITS } from './limits.ts';
import { reducer } from '../state/reducer.ts';
import { storageUsedMb } from '../state/selectors.ts';
import type { AppState, Site, UploadResult } from '../state/types.ts';
import {
  demoRunning,
  scenarioById,
  scenarios,
  scenarioState,
} from './scenarios.ts';

const routes: Record<string, string> = {
  'signed-out': '/login',
  'a-home': '/manage/nan',
  'b-home': '/manage/temir',
  'b-opens-a': '/manage/nan',
  'plan-not-selected': '/manage/nan/upload',
  'reject-no-index': '/manage/nan/upload',
  'reject-unsafe-path': '/manage/nan/upload',
  'reject-archive-size': '/manage/nan/upload',
  'reject-unpacked-size': '/manage/nan/upload',
  'reject-storage': '/manage/nan/upload',
  'second-site': '/manage/nan/plan',
  'preview-b': '/manage/nan/preview',
  'publish-ok': '/manage/nan',
  'publish-fail': '/manage/nan/versions',
  'rollback-ok': '/manage/nan/versions',
  'rollback-none': '/manage/nan/versions',
  'rollback-fail': '/manage/nan/versions',
  'domain-pending': '/manage/nan/domain',
  'domain-active': '/manage/nan/domain',
  'domain-failed': '/manage/nan/domain',
  'domain-deferred': '/manage/nan',
  'storage-stale': '/manage/nan',
};

function byId(id: string): AppState {
  const scenario = scenarioById(id);
  if (!scenario) throw new Error(`missing ${id}`);
  return scenarioState(scenario);
}

function siteOf(state: AppState, slug = 'nan'): Site {
  const site = state.sites[slug];
  if (!site) throw new Error(`missing ${slug}`);
  return site;
}

function unpacked(name: string): number {
  const value = archives[name]?.unpackedMb;
  if (value === null || value === undefined) {
    throw new Error(`${name} has no unpacked size`);
  }
  return value;
}

function uploadResult(state: AppState): UploadResult {
  const result = state.lastResult;
  if (!result || result.kind !== 'upload') {
    throw new Error('expected an upload result');
  }
  return result;
}

describe('scenarios', () => {
  it('lists the 22 ids and lands each one on its route', () => {
    expect(scenarios.map((item) => item.id)).toEqual(Object.keys(routes));
    expect(new Set(scenarios.map((item) => item.id)).size).toBe(22);

    for (const item of scenarios) {
      expect(item.route, item.id).toBe(routes[item.id]);
      expect(Object.keys(item).sort(), item.id).toEqual([
        'actions',
        'id',
        'route',
        'setup',
        'title',
      ]);
      expect(item, item.id).not.toHaveProperty('criterionIds');
      expect(
        item.actions.every(
          (action) => action.type !== 'load' && action.type !== 'setDemo',
        ),
        item.id,
      ).toBe(true);

      const state = scenarioState(item);
      expect(state.scenarioId, item.id).toBe(item.id);
      expect(state.demo, item.id).toBeNull();
      for (const site of Object.values(state.sites)) {
        if (site.domain.status === 'active') {
          expect(site.domain.controlVerified, item.id).toBe(true);
        }
      }
    }
  });

  it('does not mutate the baseline', () => {
    const snapshot = structuredClone(baseline);
    for (const item of scenarios) scenarioState(item);
    expect(baseline).toEqual(snapshot);
  });

  it('opens a management route with a signed-in session', () => {
    for (const item of scenarios) {
      if (!item.route.startsWith('/manage/')) continue;
      const state = scenarioState(item);
      expect(state.sessionAccountId, item.id).not.toBeNull();
      if (item.id === 'b-opens-a') {
        expect(state.sessionAccountId).toBe('b');
        continue;
      }
      const slug = item.route.split('/')[2];
      expect(state.sessionAccountId, item.id).toBe(
        slug === 'temir' ? 'b' : 'a',
      );
    }
  });

  it('signs out, opens each home, and denies the other account', () => {
    expect(byId('signed-out')).toEqual({
      ...baseline,
      scenarioId: 'signed-out',
    });

    const homeA = byId('a-home');
    expect(homeA.sessionAccountId).toBe('a');
    expect(homeA.planSelected.a).toBe(true);
    expect(siteOf(homeA).activeVersionId).toBe('nan-v1');
    expect(siteOf(homeA).candidateVersionId).toBeNull();
    expect(siteOf(homeA).previousActiveId).toBeNull();
    expect(siteOf(homeA).domain.status).toBe('notStarted');
    expect(siteOf(homeA).deployment).toBe('published');
    expect(storageUsedMb(siteOf(homeA))).toBe(unpacked('nan-v1.zip'));

    const homeB = byId('b-home');
    expect(homeB.sessionAccountId).toBe('b');
    expect(homeB.planSelected.b).toBe(true);
    expect(siteOf(homeB, 'temir').activeVersionId).toBe('temir-v1');
    expect(siteOf(homeB, 'temir').previousActiveId).toBeNull();
    expect(storageUsedMb(siteOf(homeB, 'temir'))).toBe(
      unpacked('temir-v1.zip'),
    );

    const denied = byId('b-opens-a');
    expect(denied.sessionAccountId).toBe('b');
    expect(siteOf(denied).ownerId).toBe('a');
    expect(denied.sites).toEqual(baseline.sites);
  });

  it('keeps the plan unselected and rejects a second site', () => {
    const plan = byId('plan-not-selected');
    expect(plan.sessionAccountId).toBe('a');
    expect(plan.planSelected).toEqual({ a: false, b: true });
    expect(siteOf(plan).activeVersionId).toBe('nan-v1');
    expect(plan.lastResult).toBeNull();

    const second = byId('second-site');
    expect(second.sessionAccountId).toBe('a');
    expect(second.planSelected.a).toBe(true);
    expect(Object.keys(second.sites)).toEqual(['nan', 'temir']);
    expect(second.lastResult).toMatchObject({
      kind: 'addSite',
      ok: false,
    });
    expect(
      second.lastResult?.kind === 'addSite' && second.lastResult.nextStep,
    ).toContain(String(LIMITS.sites));
  });

  it('rejects uploads and leaves the active version in place', () => {
    const cases = [
      ['reject-no-index', 'nan-no-index.zip', 'noIndex'],
      ['reject-unsafe-path', 'nan-unsafe.zip', 'unsafePath'],
      ['reject-archive-size', 'nan-28mb.zip', 'archiveSize'],
      ['reject-unpacked-size', 'nan-unpack-60.zip', 'unpackedSize'],
    ] as const;

    for (const [id, name, reason] of cases) {
      const state = byId(id);
      const result = uploadResult(state);
      expect(result.archiveName, id).toBe(name);
      expect(result.ok, id).toBe(false);
      if (!result.ok) expect(result.reason, id).toBe(reason);
      expect(siteOf(state).activeVersionId, id).toBe('nan-v1');
      expect(siteOf(state).candidateVersionId, id).toBeNull();
      expect(result.ok === false && result.nextStep, id).toContain(
        'Активная версия не изменилась: A.',
      );
    }

    const unsafe = uploadResult(byId('reject-unsafe-path'));
    expect(unsafe.ok).toBe(false);
    if (!unsafe.ok) {
      expect(unsafe.path).toBe('../secret.txt');
      expect(unsafe.nextStep).toContain('«../secret.txt»');
    }

    const archiveSize = uploadResult(byId('reject-archive-size'));
    expect(archiveSize).toMatchObject({
      ok: false,
      reason: 'archiveSize',
      actualMb: archives['nan-28mb.zip']?.archiveMb,
      limitMb: LIMITS.archiveMb,
    });

    const unpackedSize = uploadResult(byId('reject-unpacked-size'));
    expect(unpackedSize).toMatchObject({
      ok: false,
      reason: 'unpackedSize',
      actualMb: unpacked('nan-unpack-60.zip'),
      limitMb: LIMITS.unpackedMb,
    });

    const stored = byId('reject-storage');
    const retained = ['nan-v1.zip', 'nan-v2.zip', 'nan-v3.zip', 'nan-v4.zip']
      .map(unpacked)
      .reduce((total, value) => total + value, 0);
    const result = uploadResult(stored);
    expect(siteOf(stored).versions.map((version) => version.label)).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
    expect(siteOf(stored).activeVersionId).toBe('nan-v4');
    expect(siteOf(stored).candidateVersionId).toBeNull();
    expect(storageUsedMb(siteOf(stored))).toBe(retained);
    expect(result).toMatchObject({
      ok: false,
      reason: 'storage',
      archiveName: 'nan-storage.zip',
      actualMb: retained + unpacked('nan-storage.zip'),
      limitMb: LIMITS.storageMb,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.nextStep).toContain('Активная версия не изменилась: D.');
    }
  });

  it('previews B, publishes it, and can fail the publication', () => {
    const preview = byId('preview-b');
    expect(siteOf(preview).activeVersionId).toBe('nan-v1');
    expect(siteOf(preview).candidateVersionId).toBe('nan-v2');
    expect(siteOf(preview).deployment).toBe('published');
    expect(siteOf(preview).previousActiveId).toBeNull();
    expect(storageUsedMb(siteOf(preview))).toBe(
      unpacked('nan-v1.zip') + unpacked('nan-v2.zip'),
    );

    const published = byId('publish-ok');
    expect(siteOf(published).activeVersionId).toBe('nan-v2');
    expect(siteOf(published).previousActiveId).toBe('nan-v1');
    expect(siteOf(published).candidateVersionId).toBeNull();
    expect(siteOf(published).deployment).toBe('published');
    expect(storageUsedMb(siteOf(published))).toBe(
      unpacked('nan-v1.zip') + unpacked('nan-v2.zip'),
    );

    const failed = byId('publish-fail');
    expect(failed.simulate.publishFails).toBe(true);
    expect(siteOf(failed).activeVersionId).toBe('nan-v1');
    expect(siteOf(failed).candidateVersionId).toBe('nan-v2');
    expect(siteOf(failed).previousActiveId).toBeNull();
    expect(siteOf(failed).deployment).toBe('publishFailed');
  });

  it('rolls back to A, explains missing history, and keeps B when rollback fails', () => {
    const rolled = byId('rollback-ok');
    expect(siteOf(rolled).activeVersionId).toBe('nan-v1');
    expect(siteOf(rolled).previousActiveId).toBeNull();
    expect(siteOf(rolled).candidateVersionId).toBeNull();
    expect(siteOf(rolled).deployment).toBe('rolledBack');
    expect(siteOf(rolled).versions.map((version) => version.label)).toEqual([
      'A',
      'B',
    ]);

    const none = byId('rollback-none');
    expect(none.sessionAccountId).toBe('a');
    expect(siteOf(none).previousActiveId).toBeNull();
    expect(siteOf(none).activeVersionId).toBe('nan-v1');
    expect(siteOf(none).deployment).toBe('published');

    const failed = byId('rollback-fail');
    expect(failed.simulate.rollbackFails).toBe(true);
    expect(siteOf(failed).activeVersionId).toBe('nan-v2');
    expect(siteOf(failed).previousActiveId).toBe('nan-v1');
    expect(siteOf(failed).deployment).toBe('rollbackFailed');
  });

  it('walks pending, active, failed and deferred domain states', () => {
    const pending = siteOf(byId('domain-pending'));
    expect(pending.domain).toEqual({
      name: 'nan.example',
      status: 'pending',
      controlVerified: false,
    });

    const active = siteOf(byId('domain-active'));
    expect(active.domain).toEqual({
      name: 'nan.example',
      status: 'active',
      controlVerified: true,
    });

    const failed = byId('domain-failed');
    expect(failed.simulate.domainCheck).toBe('fail');
    expect(siteOf(failed).domain).toEqual({
      name: 'nan.example',
      status: 'failed',
      controlVerified: false,
    });

    const deferred = byId('domain-deferred');
    expect(deferred.sessionAccountId).toBe('a');
    expect(siteOf(deferred).domain).toEqual({
      name: null,
      status: 'deferred',
      controlVerified: false,
    });
    expect(siteOf(deferred, 'temir').domain.status).toBe('notStarted');
  });

  it('marks storage stale without changing the retained size', () => {
    const state = byId('storage-stale');
    const site = siteOf(state);
    expect(state.sessionAccountId).toBe('a');
    expect(site.storageDataStatus).toBe('stale');
    expect(site.lastUpdatedAt).toBe(baselineUpdatedAt);
    expect(storageUsedMb(site)).toBe(unpacked('nan-v1.zip'));
    expect(siteOf(state, 'temir').storageDataStatus).toBe('current');
  });

  it('clears simulate flags when the baseline is loaded again', () => {
    const failed = byId('publish-fail');
    expect(failed.simulate.publishFails).toBe(true);
    expect(reducer(failed, { type: 'load', state: baseline })).toEqual(
      baseline,
    );
  });

  it('treats a running demo as the lock for the scenario control', () => {
    expect(demoRunning(null)).toBe(false);
    expect(demoRunning({ step: 1 })).toBe(true);
  });
});
