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
import {
  activeVersionLine,
  formatMb,
  publishButtonLabel,
  publishConfirmText,
  publishConfirmTitle,
  publishFailedLine,
  versionSizeLine,
} from './Versions.copy.ts';
import { PublishDialog } from './Versions.tsx';

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

function renderAt(path: string, state: AppState = baseline): string {
  const storage = memoryStorage();
  writeSession(storage, state);
  vi.stubGlobal('sessionStorage', storage);
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)),
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

function row(html: string, archiveName: string): string {
  const item = html
    .split('<li')
    .find((part) => part.includes(`>${archiveName}<`));
  expect(item, archiveName).toBeTruthy();
  return item ?? '';
}

describe('version copy', () => {
  it('builds the active, failure and confirm lines from the version label', () => {
    expect(activeVersionLine('A')).toBe('Активна версия A');
    expect(publishFailedLine('A')).toBe(
      'Публикация не прошла. Активная версия: A.',
    );
    expect(publishButtonLabel('B')).toBe('Опубликовать версию B');
    expect(publishConfirmTitle('B')).toBe('Опубликовать версию B?');
    expect(publishConfirmText('A', 'B')).toBe(
      'Сейчас активна версия A. После подтверждения активной станет версия B.',
    );
    expect(versionSizeLine(baseline.sites.nan.versions[0])).toBe(
      'Архив 4,2 МБ, распакованный 12 МБ',
    );
    expect(formatMb(4.2)).toBe('4,2 МБ');
    expect(formatMb(12)).toBe('12 МБ');
    expect(formatMb(5.1)).toBe('5,1 МБ');
  });
});

describe('Versions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the active version and does not offer publish or rollback without a candidate', () => {
    const html = renderAt('/manage/nan/versions');
    expect(html).toContain('<h1>Версии</h1>');
    expect(html).toContain('Активна версия A');
    expect(html).toContain('nan-v1.zip');
    expect(html).toContain(versionSizeLine(baseline.sites.nan.versions[0]));
    expect(row(html, 'nan-v1.zip')).toContain('активная версия');
    expect(html).not.toContain('кандидат');
    expect(html).toContain('Кандидата нет.');
    expect(html).toContain('href="/manage/nan/upload"');
    expect(html).toContain('>Загрузить архив</a>');
    expect(html).not.toContain('Опубликовать');
    expect(html).not.toContain('Вернуть');
    expect(html.slice(html.indexOf('<main'))).not.toContain('<button');
    expect(html).not.toContain('role="dialog"');
  });

  it('lists the other account the same way', () => {
    const html = renderAt('/manage/temir/versions');
    expect(html).toContain('Активна версия A');
    expect(html).toContain('temir-v1.zip');
    expect(row(html, 'temir-v1.zip')).toContain('активная версия');
    expect(html).not.toContain('Опубликовать');
    expect(html).not.toContain('Вернуть');
  });

  it('B3-AC1 keeps A active while B is only the candidate', () => {
    const html = renderAt('/manage/nan/versions', withCandidate());
    expect(html).toContain('Активна версия A');
    expect(row(html, 'nan-v1.zip')).toContain('активная версия');
    expect(row(html, 'nan-v1.zip')).not.toContain('кандидат');
    expect(row(html, 'nan-v2.zip')).toContain('кандидат');
    expect(row(html, 'nan-v2.zip')).not.toContain('активная версия');
    expect(html).toContain('>Опубликовать версию B</button>');
    expect(html).not.toContain('Кандидата нет.');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('Вернуть');
  });

  it('B3-AC2 confirmation makes B active', () => {
    const published = reducer(withCandidate(), {
      type: 'publish',
      slug: 'nan',
    });
    const html = renderAt('/manage/nan/versions', published);
    expect(html).toContain('Активна версия B');
    expect(html).not.toContain('Активна версия A');
    expect(row(html, 'nan-v2.zip')).toContain('активная версия');
    expect(row(html, 'nan-v1.zip')).not.toContain('активная версия');
    expect(html).not.toContain('кандидат');
    expect(html).not.toContain('Опубликовать');
    expect(html).not.toContain('Публикация не прошла');
    expect(html).not.toContain('Вернуть');
  });

  it('B3-AC3 a failed publication keeps A active', () => {
    const uploaded = withCandidate();
    const failed = reducer(
      {
        ...uploaded,
        simulate: { ...uploaded.simulate, publishFails: true },
      },
      { type: 'publish', slug: 'nan' },
    );
    const html = renderAt('/manage/nan/versions', failed);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Публикация не прошла. Активная версия: A.');
    expect(html).toContain('Активна версия A');
    expect(row(html, 'nan-v1.zip')).toContain('активная версия');
    expect(row(html, 'nan-v2.zip')).toContain('кандидат');
    expect(html).toContain('>Опубликовать версию B</button>');
    expect(html).not.toContain('Вернуть');
  });

  it('asks for confirmation before the active version changes', () => {
    const html = renderToStaticMarkup(
      createElement(PublishDialog, {
        activeLabel: 'A',
        candidateLabel: 'B',
        onConfirm() {},
        onClose() {},
      }),
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Опубликовать версию B?');
    expect(html).toContain('>Опубликовать версию B</button>');
    expect(html).toContain('>Отмена</button>');
    expect(html).toContain(
      'Сейчас активна версия A. После подтверждения активной станет версия B.',
    );
  });

  it('shows the not-found page for an unknown site', () => {
    const html = renderAt('/manage/missing/versions');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain('Активна версия');
  });
});
