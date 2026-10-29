import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { archives } from '../data/archives.ts';
import { baseline } from '../data/accounts.ts';
import { LIMITS } from '../data/limits.ts';
import { reducer } from '../state/reducer.ts';
import { StoreProvider, writeSession } from '../state/store.tsx';
import type { AppState } from '../state/types.ts';
import { Plan } from './Plan.tsx';
import {
  accountLimitLine,
  addSiteNotice,
  archiveLimitLine,
  ownedSites,
  ruCount,
  siteLimitLine,
  storageLimitLine,
  unpackedLimitLine,
} from './PlanText.ts';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

function renderPlan(path: string, state: AppState = baseline): string {
  const storage = memoryStorage();
  writeSession(storage, state);
  vi.stubGlobal('sessionStorage', storage);
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        StoreProvider,
        null,
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: '/manage/:slug/plan',
            element: createElement(Plan),
          }),
        ),
      ),
    ),
  );
}

describe('plan copy', () => {
  it('counts sites in Russian', () => {
    expect(ruCount(1, 'сайт', 'сайта', 'сайтов')).toBe('1 сайт');
    expect(ruCount(2, 'сайт', 'сайта', 'сайтов')).toBe('2 сайта');
    expect(ruCount(5, 'сайт', 'сайта', 'сайтов')).toBe('5 сайтов');
    expect(ruCount(11, 'сайт', 'сайта', 'сайтов')).toBe('11 сайтов');
    expect(ruCount(21, 'сайт', 'сайта', 'сайтов')).toBe('21 сайт');
    expect(ruCount(3, 'полную версию', 'полных версии', 'полных версий')).toBe(
      '3 полных версии',
    );
  });

  it('B7-AC1 builds every limit from LIMITS', () => {
    expect(siteLimitLine()).toBe(`${LIMITS.sites} сайт на аккаунт.`);
    expect(archiveLimitLine()).toBe(`До ${LIMITS.archiveMb} МБ.`);
    expect(unpackedLimitLine()).toBe(`До ${LIMITS.unpackedMb} МБ.`);
    expect(storageLimitLine()).toBe(
      `До ${LIMITS.storageMb} МБ. Это ${LIMITS.storageMb / LIMITS.unpackedMb} полных версии по ${LIMITS.unpackedMb} МБ.`,
    );
  });
});

describe('Plan', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('explains the selected pilot plan for account A and account B', () => {
    const nan = renderPlan('/manage/nan/plan');
    const temir = renderPlan('/manage/temir/plan');

    for (const html of [nan, temir]) {
      expect(html).toContain('<h1>Пилотный план</h1>');
      expect(html).toContain('Пилотный план выбран.');
      expect(html).toContain(
        'Сжатый архив и распакованная версия проверяются отдельно.',
      );
      expect(html).toContain(siteLimitLine());
      expect(html).toContain(archiveLimitLine());
      expect(html).toContain(unpackedLimitLine());
      expect(html).toContain(storageLimitLine());
      expect(html).toContain('Загрузка сверх лимита не проходит.');
      expect(html).toContain('Активная версия не меняется.');
    }

    expect(nan).toContain(accountLimitLine(ownedSites(baseline, 'a')));
    expect(temir).toContain(accountLimitLine(ownedSites(baseline, 'b')));
    expect(nan).toContain('«Пекарня Нан»');
    expect(nan).not.toContain('Мастерская Темир');
    expect(temir).toContain('«Мастерская Темир»');
    expect(temir).not.toContain('Пекарня Нан');
    expect(nan).toContain('href="/manage/nan/upload"');
    expect(temir).toContain('href="/manage/temir/upload"');
    expect(nan).not.toContain('Выбрать пилотный план');
  });

  it('offers selectPlan while the pilot plan is not chosen', () => {
    const closed: AppState = {
      ...baseline,
      planSelected: { a: false, b: true },
    };
    const before = renderPlan('/manage/nan/plan', closed);
    expect(before).toContain('Пилотный план не выбран.');
    expect(before).toContain('Выбрать пилотный план');
    expect(before).toContain('<button');
    expect(before).not.toContain('disabled');
    expect(before).not.toContain('Перейти к загрузке');
    expect(before).toContain(siteLimitLine());

    const chosen = reducer(closed, { type: 'selectPlan', accountId: 'a' });
    expect(chosen.planSelected).toEqual({ a: true, b: true });
    expect(chosen.sites).toBe(closed.sites);

    const after = renderPlan('/manage/nan/plan', chosen);
    expect(after).toContain('Пилотный план выбран.');
    expect(after).not.toContain('Выбрать пилотный план');
    expect(after).toContain('Перейти к загрузке');
    expect(after).toContain('href="/manage/nan/upload"');
  });

  it('B7-AC2 explains the one-site limit and leaves the count unchanged', () => {
    const next = reducer(baseline, { type: 'addSite' });
    const owned = ownedSites(next, 'a');
    expect(owned).toHaveLength(LIMITS.sites);
    expect(next.sites).toEqual(baseline.sites);
    expect(addSiteNotice(next.lastResult)).toBe(
      `Сайт уже есть. Лимит пилотного плана: ${LIMITS.sites} сайт. Работайте с текущим сайтом.`,
    );

    const html = renderPlan('/manage/nan/plan', next);
    expect(html).toContain('Добавить сайт');
    expect(html).toContain('role="alert"');
    expect(html).toContain(addSiteNotice(next.lastResult) ?? '');
    expect(html).toContain(accountLimitLine(owned));
    expect(html).toContain(`${LIMITS.sites} сайт`);
  });

  it('counts owned sites from state', () => {
    const doubled: AppState = {
      ...baseline,
      sites: {
        ...baseline.sites,
        nan2: {
          ...baseline.sites.nan,
          slug: 'nan2',
          businessName: 'Вторая пекарня',
        },
      },
    };
    const owned = ownedSites(doubled, 'a');
    expect(owned).toHaveLength(2);
    expect(accountLimitLine(owned)).toBe(
      `На аккаунте 2 сайта: «Пекарня Нан», «Вторая пекарня». Лимит пилотного плана: ${LIMITS.sites} сайт.`,
    );
    expect(renderPlan('/manage/nan/plan', doubled)).toContain(
      accountLimitLine(owned),
    );
  });

  it('keeps an upload rejection off this screen', () => {
    const next = reducer(baseline, {
      type: 'upload',
      slug: 'nan',
      archive: archives['nan-28mb.zip'],
      uploadedAt: '2026-10-29T00:00:00.000Z',
    });
    expect(next.lastResult?.kind).toBe('upload');
    expect(addSiteNotice(next.lastResult)).toBeNull();

    const html = renderPlan('/manage/nan/plan', next);
    expect(html).not.toContain('role="alert"');
    if (next.lastResult?.kind === 'upload' && !next.lastResult.ok) {
      expect(html).not.toContain(next.lastResult.nextStep);
    }
  });

  it('shows not found for an unknown site', () => {
    const html = renderPlan('/manage/missing/plan');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain('Пилотный план');
    expect(html).not.toContain('Добавить сайт');
  });
});
