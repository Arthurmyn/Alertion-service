import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline } from './data/accounts.ts';
import { App } from './App.tsx';
import { reducer } from './state/reducer.ts';
import { SESSION_KEY, writeSession } from './state/store.tsx';

vi.mock('react-router-dom', async () => {
  const React = await import('react');
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    Navigate(props: { to: string; replace?: boolean }) {
      return React.createElement('div', {
        'data-redirect': props.to,
        'data-replace': String(Boolean(props.replace)),
      });
    },
  };
});

const screens = [
  ['/login', 'Вход'],
  ['/manage/nan', 'Управление сайтом'],
  ['/manage/temir', 'Управление сайтом'],
  ['/manage/nan/upload', 'Загрузка'],
  ['/manage/nan/preview', 'Предпросмотр'],
  ['/manage/nan/versions', 'Версии'],
  ['/manage/nan/domain', 'Домен'],
  ['/manage/nan/plan', 'Пилотный план'],
  ['/site/nan', 'Публичная страница'],
  ['/site/temir', 'Публичная страница'],
  ['/defense', 'Защита проекта'],
] as const;

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

function renderAt(path: string, accountId?: 'a' | 'b'): string {
  if (accountId) {
    const storage = memoryStorage();
    writeSession(storage, reducer(baseline, { type: 'signIn', accountId }));
    vi.stubGlobal('sessionStorage', storage);
  }

  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)),
  );
}

function ownerFor(path: string): 'a' | 'b' | undefined {
  if (path.startsWith('/manage/temir')) return 'b';
  if (path.startsWith('/manage/')) return 'a';
  return undefined;
}

function anchors(html: string): string[] {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? [];
}

function isCurrent(html: string, href: string): boolean {
  return anchors(html).some(
    (tag) =>
      tag.includes(`href="${href}"`) && tag.includes('aria-current="page"'),
  );
}

describe('routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders every screen', () => {
    for (const [path, heading] of screens) {
      const accountId = ownerFor(path);
      if (!accountId) vi.unstubAllGlobals();
      const html = renderAt(path, accountId);
      expect(html, path).toContain(`>${heading}</h1>`);
      expect(html, path).toContain('src="/logo.png"');
    }
  });

  it('keeps management links off the public site', () => {
    const html = renderAt('/site/nan');
    expect(html).toContain('Пекарня Нан');
    expect(html).not.toContain('href="/manage/');
    expect(html).not.toContain('Защита проекта');
    expect(renderAt('/site/temir')).toContain('Мастерская Темир');

    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'a' }),
    );
    vi.stubGlobal('sessionStorage', storage);
    const signedIn = renderAt('/site/nan');
    expect(signedIn).toContain('Пекарня Нан');
    expect(signedIn).not.toContain('href="/manage/');
    expect(signedIn).not.toContain('Защита проекта');
  });

  it('redirects / to login when signed out', () => {
    const html = renderAt('/');
    expect(html).toContain('data-redirect="/login"');
    expect(html).toContain('data-replace="true"');
  });

  it('redirects / to the signed-in site', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'a' }),
    );
    expect(storage.getItem(SESSION_KEY)).toContain('"sessionAccountId":"a"');
    vi.stubGlobal('sessionStorage', storage);

    expect(renderAt('/')).toContain('data-redirect="/manage/nan"');

    const other = memoryStorage();
    writeSession(other, reducer(baseline, { type: 'signIn', accountId: 'b' }));
    vi.stubGlobal('sessionStorage', other);
    expect(renderAt('/')).toContain('data-redirect="/manage/temir"');
  });

  it('marks the open section in the nav', () => {
    const upload = renderAt('/manage/nan/upload', 'a');
    expect(isCurrent(upload, '/manage/nan/upload')).toBe(true);
    expect(isCurrent(upload, '/manage/nan')).toBe(false);
    expect(isCurrent(upload, '/defense')).toBe(false);

    const home = renderAt('/manage/temir', 'b');
    expect(isCurrent(home, '/manage/temir')).toBe(true);
    expect(isCurrent(home, '/manage/temir/plan')).toBe(false);
    expect(home).toContain('href="/manage/temir/plan"');

    vi.unstubAllGlobals();
    const login = renderAt('/login');
    expect(isCurrent(login, '/login')).toBe(true);
    expect(isCurrent(login, '/defense')).toBe(false);

    const defense = renderAt('/defense');
    expect(isCurrent(defense, '/defense')).toBe(true);
    expect(isCurrent(defense, '/login')).toBe(false);
    const manageHrefs = [...defense.matchAll(/href="(\/manage\/[^"]*)"/g)].map(
      (match) => match[1] ?? '',
    );
    expect(manageHrefs.every((href) => href.includes('?scenario='))).toBe(true);

    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'b' }),
    );
    vi.stubGlobal('sessionStorage', storage);
    const signedIn = renderAt('/defense');
    expect(isCurrent(signedIn, '/defense')).toBe(true);
    expect(signedIn).toContain('href="/manage/temir"');
    expect(signedIn).not.toContain('>Вход</a>');
  });

  it('shows a not-found page with a link home', () => {
    for (const path of ['/missing', '/manage/nan/missing', '/site/missing']) {
      const html = renderAt(path);
      expect(html, path).toContain('<h1>Страница не найдена</h1>');
      expect(html, path).not.toContain('Публичная страница');
      expect(
        anchors(html).some(
          (tag) => tag.includes('href="/"') && tag.includes('>На главную</a>'),
        ),
      ).toBe(true);
    }
  });

  it('does not build nav from an unknown public address', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'b' }),
    );
    vi.stubGlobal('sessionStorage', storage);

    const html = renderAt('/site/missing');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).toContain('href="/manage/temir"');
    expect(html).not.toContain('href="/manage/missing');
    expect(html).not.toContain('Публичная страница');
  });
});
