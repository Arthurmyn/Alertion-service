import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App.tsx';
import { baseline } from '../data/accounts.ts';
import { archives } from '../data/archives.ts';
import { reducer } from '../state/reducer.ts';
import { writeSession } from '../state/store.tsx';
import type { AppState } from '../state/types.ts';

const audience =
  'Предпросмотр видите только вы, пока выполнен вход в аккаунт этого сайта. Посетители и другие аккаунты видят активную версию.';

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

function pageMain(html: string): string {
  const start = html.indexOf('<main');
  const end = html.indexOf('</main>');
  if (start < 0 || end < start) throw new Error('no main');
  return html.slice(start, end);
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

function renderAt(path: string, state: AppState = baseline): string {
  const storage = memoryStorage();
  writeSession(storage, withOwner(path, state));
  vi.stubGlobal('sessionStorage', storage);
  return pageMain(
    renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(App),
      ),
    ),
  );
}

function withCandidate(): AppState {
  return reducer(baseline, {
    type: 'upload',
    slug: 'nan',
    archive: archives['nan-v2.zip'],
    uploadedAt: '2026-10-29T12:00:00.000Z',
  });
}

describe('Preview', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('B3-AC1 shows an empty state and a link to upload when there is no candidate', () => {
    const html = renderAt('/manage/nan/preview');
    expect(html).toContain('<h1>Предпросмотр</h1>');
    expect(html).toContain('Активна версия A');
    expect(html).toContain('Кандидата нет.');
    expect(html).toContain('href="/manage/nan/upload"');
    expect(html).toContain('>Загрузить архив</a>');
    expect(html.indexOf(audience)).toBeLessThan(html.indexOf('Кандидата нет.'));
    expect(html.indexOf('Кандидата нет.')).toBeLessThan(
      html.indexOf('Загрузить архив'),
    );
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('Круассан');
    expect(html).toContain(audience);
  });

  it('B3-AC1 previewing B leaves A active', () => {
    const html = renderAt('/manage/nan/preview', withCandidate());
    expect(html).toContain('Активна версия A');
    expect(html).toContain('Кандидат: версия B');
    expect(html.indexOf(audience)).toBeLessThan(
      html.indexOf('Кандидат: версия B'),
    );
    expect(html.indexOf('Кандидат: версия B')).toBeLessThan(
      html.indexOf('<iframe'),
    );
    expect(html).toContain('<iframe');
    expect(html).toContain('sandbox=""');
    expect(html).toContain('Круассан, 900 ₸');
    expect(html).not.toContain('Опубликовать');
    expect(html).not.toContain('<button');
  });

  it('B3-AC4 explains who can view the preview', () => {
    const html = renderAt('/manage/nan/preview', withCandidate());
    expect(html).toContain(audience);
    expect(html).toContain('Активна версия A');
  });

  it('keeps A active on the preview after a failed publication', () => {
    const uploaded = withCandidate();
    const failed = reducer(
      {
        ...uploaded,
        simulate: { ...uploaded.simulate, publishFails: true },
      },
      { type: 'publish', slug: 'nan' },
    );
    const html = renderAt('/manage/nan/preview', failed);
    expect(html).toContain('Активна версия A');
    expect(html).toContain('Кандидат: версия B');
    expect(html).toContain('Круассан, 900 ₸');
  });

  it('shows the not-found page for an unknown site', () => {
    const html = renderAt('/manage/missing/preview');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain('Кандидата нет.');
  });
});
