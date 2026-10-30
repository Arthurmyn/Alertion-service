import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App.tsx';
import { baseline } from '../data/accounts.ts';
import { archives } from '../data/archives.ts';
import { reducer } from '../state/reducer.ts';
import { writeSession } from '../state/store.tsx';
import { manageNext, safeNext, signInPath } from './LoginPath.ts';

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

function renderAt(path: string, accountId?: 'a' | 'b'): string {
  if (accountId) {
    const storage = memoryStorage();
    writeSession(storage, reducer(baseline, { type: 'signIn', accountId }));
    vi.stubGlobal('sessionStorage', storage);
  } else {
    vi.stubGlobal('sessionStorage', memoryStorage());
  }

  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)),
  );
}

function renderState(path: string, state: typeof baseline): string {
  const storage = memoryStorage();
  writeSession(storage, state);
  vi.stubGlobal('sessionStorage', storage);
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)),
  );
}

describe('sign-in target', () => {
  it('keeps a management return path and drops an outside address', () => {
    expect(safeNext('/manage/nan/upload')).toBe('/manage/nan/upload');
    expect(safeNext('/manage/nan?x=1')).toBe('/manage/nan?x=1');
    expect(safeNext(null)).toBeNull();
    expect(safeNext('')).toBeNull();
    expect(safeNext('https://evil.example')).toBeNull();
    expect(safeNext('//evil.example')).toBeNull();
    expect(safeNext('/\\evil.example')).toBeNull();
    expect(safeNext('/manage/nan extra')).toBeNull();

    expect(manageNext('/manage/nan')).toBe('/manage/nan');
    expect(manageNext('/site/nan')).toBeNull();
    expect(signInPath('a', '/manage/temir')).toBe('/manage/temir');
    expect(signInPath('b', null)).toBe('/manage/temir');
    expect(signInPath('a', 'https://evil.example')).toBe('/manage/nan');
  });
});

describe('B1 account boundaries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a signed-out management visit to login with the return path', () => {
    const html = pageMain(renderAt('/manage/nan/upload'));
    expect(html).toContain(
      'data-redirect="/login?next=%2Fmanage%2Fnan%2Fupload"',
    );
    expect(html).toContain('data-replace="true"');
    expect(html).not.toContain('<h1>Загрузка</h1>');
    expect(html).not.toContain('Пекарня Нан');

    const home = pageMain(renderAt('/manage/temir'));
    expect(home).toContain('data-redirect="/login?next=%2Fmanage%2Ftemir"');
    expect(home).not.toContain('<h1>Управление сайтом</h1>');
  });

  it('asks for sign-in and offers the two accounts, with no password field', () => {
    const html = pageMain(renderAt('/login?next=%2Fmanage%2Fnan'));
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('>Вход</h1>');
    expect(html).toContain('Войдите, чтобы управлять сайтом.');
    expect(html).toContain('<code');
    expect(html).toContain('>/manage/nan</code>');
    expect(html).toContain('2 вымышленных аккаунта');
    expect(html).toContain('симуляция');
    expect(html).toContain('Войти как Айгуль С., Пекарня Нан');
    expect(html).toContain('Войти как Ерлан Б., Мастерская Темир');
    expect(html).toContain('aria-labelledby="login-accounts"');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('type="password"');
    expect(html.match(/<button\b/g)).toHaveLength(2);

    const plain = pageMain(renderAt('/login'));
    expect(plain).not.toContain('Войдите, чтобы управлять сайтом.');
    expect(plain).not.toContain('<code');
    expect(plain).toContain('2 вымышленных аккаунта');
    expect(plain).toContain('Пароля нет, это симуляция.');

    const outside = pageMain(
      renderAt('/login?next=https%3A%2F%2Fevil.example'),
    );
    expect(outside).not.toContain('evil.example');
    expect(outside).not.toContain('Войдите, чтобы управлять сайтом.');
  });

  it('B1-AC2 denies account B on account A and hides A data', () => {
    const html = pageMain(renderAt('/manage/nan', 'b'));
    expect(html).toContain('tabindex="-1">Нет доступа</h1>');
    expect(html).toContain('Вы вошли как Ерлан Б.');
    expect(html).not.toContain('Б..');
    expect(html).toContain('Этот сайт принадлежит другому аккаунту.');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('data-redirect=');
    expect(html).toContain('href="/manage/temir"');
    expect(html).toContain('К своему сайту «Мастерская Темир»');
    expect(html).not.toContain('Пекарня Нан');
    expect(html).not.toContain('Айгуль');
    expect(html).not.toContain('Баурсак');
    expect(html).not.toContain('nan-v1');
    expect(html).not.toContain('nan.example');
    expect(html).not.toContain('Хранилище');
    expect(html).not.toContain('<h1>Управление сайтом</h1>');

    const own = pageMain(renderAt('/manage/nan/versions', 'b'));
    expect(own).toContain('>Нет доступа</h1>');
    expect(own).not.toContain('<h1>Версии</h1>');
  });

  it('B1-AC2 sends account A away from account B', () => {
    const html = pageMain(renderAt('/manage/temir/domain', 'a'));
    expect(html).toContain('>Нет доступа</h1>');
    expect(html).toContain('Вы вошли как Айгуль С.');
    expect(html).not.toContain('С..');
    expect(html).toContain('href="/manage/nan"');
    expect(html).toContain('«Пекарня Нан»');
    expect(html).not.toContain('Мастерская Темир');
    expect(html).not.toContain('<h1>Домен</h1>');
  });

  it('B1-AC1 marks the owner screen and leaves other sections to their task', () => {
    const home = pageMain(renderAt('/manage/nan', 'a'));
    expect(home).toContain('Управление сайтом, видно только владельцу');
    expect(home).toContain('<h1>Управление сайтом</h1>');
    expect(home).not.toContain('data-redirect=');

    const upload = pageMain(renderAt('/manage/nan/upload', 'a'));
    expect(upload).toContain('<h1>Загрузка</h1>');
    expect(upload).not.toContain('Управление сайтом, видно только владельцу');
  });

  it('shows not-found for a missing site once an account is signed in', () => {
    const html = pageMain(renderAt('/manage/missing', 'a'));
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain('>Нет доступа</h1>');
    expect(html).not.toContain('Пекарня Нан');
  });
});

describe('public site', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('B1-AC1 serves the active page and hides management data', () => {
    const full = renderAt('/site/nan');
    const html = pageMain(full);
    expect(html).toContain('tabindex="-1">Публичная страница</h1>');
    expect(html).toContain('Данных управления здесь нет.');
    expect(html).toContain('Пекарня Нан');
    expect(html).toContain('<a href="/site/nan"><code>/site/nan</code></a>');
    expect(html).toContain('sandbox=""');
    expect(html).toContain('Баурсак, 500 ₸');
    expect(html).not.toContain('Круассан');
    expect(full).not.toContain('href="/manage/');
    expect(html).not.toContain('Хранилище');
    expect(html).not.toContain('Кандидат');
    expect(html).not.toContain('Пилотный план');
    expect(html).not.toContain('nan.example');
    expect(html).not.toContain('Айгуль');
    expect(html).not.toContain('МБ');

    const temir = pageMain(renderAt('/site/temir'));
    expect(temir).toContain(
      '<a href="/site/temir"><code>/site/temir</code></a>',
    );
    expect(temir).toContain('Заточка ножа, 2 000 ₸');
    expect(temir).not.toContain('Баурсак');
  });

  it('B2-AC1 keeps serving the active version after publication', () => {
    const uploadedAt = '2026-10-29T09:00:00.000Z';
    const uploaded = reducer(baseline, {
      type: 'upload',
      slug: 'nan',
      archive: archives['nan-v2.zip'],
      uploadedAt,
    });
    const published = reducer(uploaded, { type: 'publish', slug: 'nan' });
    const full = renderState('/site/nan', published);
    const html = pageMain(full);

    expect(html).toContain('<a href="/site/nan"><code>/site/nan</code></a>');
    expect(html).toContain('Баурсак, 500 ₸');
    expect(html).toContain('Круассан, 900 ₸');
    expect(html).not.toContain('Хранилище');
    expect(full).not.toContain('href="/manage/');
    expect(html).not.toContain('Кандидат');
  });
});
