import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App.tsx';
import { baseline } from '../../data/accounts.ts';
import { archives } from '../../data/archives.ts';
import { LIMITS } from '../../data/limits.ts';
import { reducer } from '../../state/reducer.ts';
import { storageUsedMb } from '../../state/selectors.ts';
import { StoreProvider, writeSession } from '../../state/store.tsx';
import type { AppState, DomainState, Site } from '../../state/types.ts';
import { Dashboard } from './Dashboard.tsx';
import { NotFound } from '../NotFound.tsx';

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

function withOwner(path: string, state: AppState): AppState {
  if (state.sessionAccountId !== null) return state;
  const slug = /^\/manage\/([^/]+)/.exec(path)?.[1];
  if (!slug) return state;
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  const ownerId = state.sites[decoded]?.ownerId ?? 'a';
  return { ...state, sessionAccountId: ownerId };
}

function renderAt(path: string, stored: AppState = baseline): string {
  const storage = memoryStorage();
  writeSession(storage, withOwner(path, stored));
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
            path: '/manage/:slug',
            element: createElement(Dashboard),
          }),
          createElement(Route, {
            path: '*',
            element: createElement(NotFound),
          }),
        ),
      ),
    ),
  );
}

function patchSite(
  slug: string,
  patch: Partial<Site>,
  state = baseline,
): AppState {
  const site = state.sites[slug];
  if (!site) throw new Error(`missing ${slug}`);
  return {
    ...state,
    sites: {
      ...state.sites,
      [slug]: { ...site, ...patch },
    },
  };
}

function domain(status: DomainState['status'], verified = false): DomainState {
  return {
    name:
      status === 'notStarted' || status === 'deferred' ? null : 'nan.example',
    status,
    controlVerified: verified,
  };
}

function publishVersionB(): AppState {
  const uploaded = reducer(baseline, {
    type: 'upload',
    slug: 'nan',
    archive: archives['nan-v2.zip'],
    uploadedAt: '2026-10-29T12:00:00.000Z',
  });
  return reducer(uploaded, { type: 'publish', slug: 'nan' });
}

const factLabels = [
  'Активная версия',
  'Адрес сайта',
  'Публикация',
  'Домен',
  'Хранилище',
];

describe('Dashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows five facts for the baseline site and one main action', () => {
    const html = renderAt('/manage/nan');
    let at = -1;
    for (const label of factLabels) {
      const next = html.indexOf(label);
      expect(next, label).toBeGreaterThan(at);
      at = next;
    }

    expect(html).toContain('<h1>Управление сайтом</h1>');
    expect(html).toContain('Пекарня Нан');
    expect(html).toContain('>A</dd>');
    expect(html).toContain('href="/site/nan"');
    expect(html).toContain('>/site/nan</a>');
    expect(html).toContain('Опубликовано');
    expect(html).toContain('href="/manage/nan/domain"');
    expect(html).toContain('Подключить домен');
    expect(html).not.toContain('Ожидание');
    expect(html).not.toContain('Активен');
    expect(html).not.toContain('Проверить снова');
    expect(html).not.toContain('Открыть версии');
    expect(html).not.toContain('Домен: недоступно');
    expect(html).toContain(
      `${storageUsedMb(baseline.sites.nan)} МБ из ${LIMITS.storageMb} МБ`,
    );
    expect(html).toContain('href="/manage/nan/upload"');
    expect(html).toContain('Загрузить архив');
    expect(html.match(/Загрузить архив/g)).toHaveLength(1);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('Данные устарели');
  });

  it('reads account B from the same selectors', () => {
    const html = renderAt('/manage/temir');
    expect(html).toContain('Мастерская Темир');
    expect(html).toContain('href="/site/temir"');
    expect(html).toContain('>A</dd>');
    expect(html).toContain(
      `${storageUsedMb(baseline.sites.temir)} МБ из ${LIMITS.storageMb} МБ`,
    );
    expect(html).not.toContain('Пекарня Нан');
    expect(html).not.toContain('href="/site/nan"');
    expect(html).toContain('href="/manage/temir/upload"');
  });

  it('follows the active version and storage after publication', () => {
    const state = publishVersionB();
    const html = renderAt('/manage/nan', state);
    expect(html).toContain('>B</dd>');
    expect(html).toContain('Опубликовано');
    expect(html).toContain(
      `${storageUsedMb(state.sites.nan)} МБ из ${LIMITS.storageMb} МБ`,
    );
    expect(storageUsedMb(state.sites.nan)).toBe(30);
  });

  it('names each deployment state and keeps the active label', () => {
    const failedPublish = reducer(
      {
        ...baseline,
        simulate: { ...baseline.simulate, publishFails: true },
      },
      {
        type: 'upload',
        slug: 'nan',
        archive: archives['nan-v2.zip'],
        uploadedAt: '2026-10-29T12:00:00.000Z',
      },
    );
    const publishFailed = reducer(failedPublish, {
      type: 'publish',
      slug: 'nan',
    });
    const publishFailedHtml = renderAt('/manage/nan', publishFailed);
    expect(publishFailedHtml).toContain('Ошибка публикации');
    expect(publishFailedHtml).toContain('href="/manage/nan/versions"');
    expect(publishFailedHtml).toContain('Открыть версии');
    expect(publishFailedHtml).toContain('>A</dd>');

    const rolled = reducer(publishVersionB(), {
      type: 'rollback',
      slug: 'nan',
    });
    const rolledHtml = renderAt('/manage/nan', rolled);
    expect(rolledHtml).toContain('Откат выполнен');
    expect(rolledHtml).not.toContain('Открыть версии');
    expect(rolledHtml).toContain('>A</dd>');

    const rollbackFailed = reducer(
      {
        ...publishVersionB(),
        simulate: { ...baseline.simulate, rollbackFails: true },
      },
      { type: 'rollback', slug: 'nan' },
    );
    const failedHtml = renderAt('/manage/nan', rollbackFailed);
    expect(failedHtml).toContain('Ошибка отката');
    expect(failedHtml).toContain('href="/manage/nan/versions"');
    expect(failedHtml).toContain('>B</dd>');
  });

  it('uses the same domain status as the site record', () => {
    const pending = renderAt(
      '/manage/nan',
      patchSite('nan', { domain: domain('pending') }),
    );
    expect(pending).toContain('Ожидание');
    expect(pending).toContain('Запись ещё не видна.');
    expect(pending).toContain('Проверить снова');
    expect(pending).toContain('href="/manage/nan/domain"');
    expect(pending).not.toContain('Подключить домен');

    const active = renderAt(
      '/manage/nan',
      patchSite('nan', { domain: domain('active', true) }),
    );
    expect(active).toContain('Активен');
    expect(active).not.toContain('Подключить домен');
    expect(active).not.toContain('Проверить снова');

    const failed = renderAt(
      '/manage/nan',
      patchSite('nan', { domain: domain('failed') }),
    );
    expect(failed).toContain('>Ошибка<');
    expect(failed).toContain('Значение TXT не совпало.');
    expect(failed).toContain('Исправить запись');
    expect(failed).toContain('href="/manage/nan/domain"');
    expect(failed).not.toContain('Подключить домен');
    expect(failed).not.toContain('Запись ещё не видна.');

    const deferred = renderAt(
      '/manage/nan',
      patchSite('nan', { domain: domain('deferred') }),
    );
    expect(deferred).toContain('Домен: недоступно в этой версии прототипа');
    expect(deferred).not.toContain('Подключить домен');
    expect(deferred).not.toContain('Проверить снова');
    expect(deferred).not.toContain('Исправить запись');
    expect(deferred).not.toContain('Ожидание');
  });

  it('shows stale storage with the saved time and an update button', () => {
    const html = renderAt(
      '/manage/nan',
      patchSite('nan', { storageDataStatus: 'stale' }),
    );
    expect(html).toContain('Данные устарели, обновлено 28.10.2026, 09:00');
    expect(html).toContain('>Обновить</button>');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('Данные обновлены');
    expect(html).toContain(
      `${storageUsedMb(baseline.sites.nan)} МБ из ${LIMITS.storageMb} МБ`,
    );

    const later = renderAt(
      '/manage/nan',
      patchSite('nan', {
        storageDataStatus: 'stale',
        lastUpdatedAt: '2026-11-03T15:04:00.000Z',
      }),
    );
    expect(later).toContain('Данные устарели, обновлено 03.11.2026, 15:04');

    const raw = renderAt(
      '/manage/nan',
      patchSite('nan', {
        storageDataStatus: 'stale',
        lastUpdatedAt: 'вчера',
      }),
    );
    expect(raw).toContain('Данные устарели, обновлено вчера');
  });

  it('reaches defense from the shell on the dashboard', () => {
    const storage = memoryStorage();
    writeSession(storage, withOwner('/manage/nan', baseline));
    vi.stubGlobal('sessionStorage', storage);
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/manage/nan'] },
        createElement(App),
      ),
    );
    const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? [];
    const defense = links.filter(
      (tag) =>
        tag.includes('href="/defense"') && tag.includes('Защита проекта'),
    );
    expect(defense).toHaveLength(1);
  });

  it('shows a not-found page for an unknown site', () => {
    const html = renderAt('/manage/missing');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain('Активная версия');
  });
});
