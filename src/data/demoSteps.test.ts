import { describe, expect, it } from 'vitest';
import { formatMb, rollbackVersion } from '../pages/project/Versions.copy.ts';
import { reducer } from '../state/reducer.ts';
import { storageUsedMb } from '../state/selectors.ts';
import { archives } from './archives.ts';
import { LIMITS } from './limits.ts';
import {
  demoCaption,
  demoCatalog,
  demoRoute,
  demoState,
  demoStepCount,
  scenarioHref,
} from './demoSteps.ts';

const versionA = archives['nan-v1.zip'];
const versionB = archives['nan-v2.zip'];
const oversized = archives['nan-28mb.zip'];

if (!versionA || !versionB || !oversized) {
  throw new Error('nan fixtures are missing');
}
if (
  versionA.label === null ||
  versionB.label === null ||
  versionA.unpackedMb === null ||
  versionB.unpackedMb === null ||
  oversized.archiveMb === null
) {
  throw new Error('nan fixtures have no size or label');
}

const labelA = versionA.label;
const labelB = versionB.label;

function storage(usedMb: number): string {
  return `${formatMb(usedMb)} из ${formatMb(LIMITS.storageMb)}`;
}

describe('demo steps', () => {
  it('walks ten steps from baseline through publish and rollback', () => {
    expect(demoStepCount).toBe(10);
    expect(demoRoute(1)).toBe('/manage/nan');
    expect(demoRoute(2)).toBe('/site/nan');
    expect(demoRoute(5)).toBe('/manage/nan/preview');
    expect(demoRoute(7)).toBe('/site/nan');
    expect(demoRoute(8)).toBe('/manage/nan/versions');
    expect(demoRoute(9)).toBe('/manage/nan');
    expect(demoRoute(10)).toBe('/defense#demo');

    const home = demoState(1);
    const site = home.sites.nan;
    expect(home.sessionAccountId).toBe('a');
    expect(home.demo).toEqual({ step: 1 });
    expect(home.scenarioId).toBeNull();
    expect(site?.activeVersionId).toBe('nan-v1');
    expect(storageUsedMb(site!)).toBe(versionA.unpackedMb);

    const rejected = demoState(3);
    const rejection = rejected.lastResult;
    expect(rejection?.kind).toBe('upload');
    expect(rejection?.ok).toBe(false);
    expect(rejected.sites.nan?.activeVersionId).toBe('nan-v1');
    expect(rejected.sites.nan?.candidateVersionId).toBeNull();

    const candidate = demoState(4);
    expect(candidate.sites.nan?.candidateVersionId).toBe('nan-v2');
    expect(candidate.sites.nan?.activeVersionId).toBe('nan-v1');

    const published = demoState(6);
    expect(published.sites.nan?.activeVersionId).toBe('nan-v2');
    expect(published.sites.nan?.previousActiveId).toBe('nan-v1');
    expect(published.sites.nan?.deployment).toBe('published');

    const beforeRollback = demoState(7);
    const throughScreen = reducer(
      beforeRollback,
      rollbackVersion(beforeRollback.sites.nan?.slug ?? ''),
    );
    const rolled = demoState(8);
    expect(rolled.sites.nan).toEqual(throughScreen.sites.nan);
    expect(rolled.sites.nan?.activeVersionId).toBe('nan-v1');
    expect(rolled.sites.nan?.previousActiveId).toBeNull();
    expect(rolled.sites.nan?.deployment).toBe('rolledBack');
    expect(storageUsedMb(rolled.sites.nan!)).toBe(
      (versionA.unpackedMb ?? 0) + (versionB.unpackedMb ?? 0),
    );

    const done = demoState(10);
    expect(done.demo).toEqual({ step: 10 });
    expect(done.sites.nan?.activeVersionId).toBe('nan-v1');
  });

  it('rebuilds an earlier step from baseline instead of keeping a snapshot', () => {
    const reached = demoState(4);
    const back = demoState(3);
    expect(back.demo).toEqual({ step: 3 });
    expect(back.sites.nan?.candidateVersionId).toBeNull();
    expect(reached.sites.nan?.candidateVersionId).toBe('nan-v2');
    expect(back.lastResult).not.toEqual(reached.lastResult);
  });

  it('builds captions from the step state, limits and fixtures', () => {
    const first = demoState(1);
    const site = first.sites.nan;
    expect(demoCaption(first)).toBe(
      `Активна версия ${labelA}. Хранилище: ${storage(storageUsedMb(site!))}.`,
    );
    expect(demoCaption(demoState(2))).toBe(
      `Публичная страница версии ${labelA}. Данных управления здесь нет.`,
    );
    expect(demoCaption(demoState(3))).toBe(
      `Архив ${formatMb(oversized.archiveMb ?? 0)} больше лимита ${formatMb(LIMITS.archiveMb)}. Активная версия по-прежнему ${labelA}.`,
    );
    expect(demoCaption(demoState(4))).toBe(
      `Проверка прошла. Версия ${labelB} стала кандидатом. Адрес сайта всё ещё показывает ${labelA}.`,
    );
    expect(demoCaption(demoState(5))).toBe(
      `Предпросмотр ${labelB} видите только вы. Активна версия ${labelA}.`,
    );
    expect(demoCaption(demoState(6))).toBe(`Версия ${labelB} опубликована.`);
    expect(demoCaption(demoState(7))).toBe(
      'На публичной странице появился круассан.',
    );
    expect(demoCaption(demoState(8))).toBe(`Снова активна версия ${labelA}.`);
    const kept = demoState(9);
    expect(demoCaption(kept)).toBe(
      `Версия ${labelA} активна. Хранилище: ${storage(storageUsedMb(kept.sites.nan!))}.`,
    );
    expect(demoCaption(demoState(10))).toBe('Демо завершено.');
  });

  it('links failure, denial and domain scenarios', () => {
    expect(demoCatalog.map((group) => group.id)).toEqual([
      'failure',
      'denial',
      'domain',
    ]);
    expect(scenarioHref('b-opens-a')).toBe('/manage/nan?scenario=b-opens-a');
    expect(scenarioHref('publish-fail')).toContain('scenario=publish-fail');
    expect(scenarioHref('domain-pending')).toContain('scenario=domain-pending');
    expect(scenarioHref('missing')).toBeNull();
  });
});
