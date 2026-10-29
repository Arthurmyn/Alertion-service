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
  confirmChangeText,
  formatMb,
  publishButtonLabel,
  publishConfirmTitle,
  publishFailedLine,
  rollbackButtonLabel,
  rollbackConfirmTitle,
  rollbackFailedLine,
  rollbackUnavailable,
  versionSizeLine,
} from './Versions.copy.ts';
import { PublishDialog, RollbackDialog } from './Versions.tsx';

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

function renderAt(path: string, state: AppState = baseline): string {
  const storage = memoryStorage();
  writeSession(storage, withOwner(path, state));
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

function publishedB(): AppState {
  return reducer(withCandidate(), { type: 'publish', slug: 'nan' });
}

function describedReason(html: string): void {
  const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1];
  expect(describedBy).toBeTruthy();
  expect(html).toContain(`id="${describedBy}"`);
  expect(html).toContain(`>${rollbackUnavailable}</p>`);
  expect(html).toContain('disabled');
  expect(html).toContain('>Вернуть версию</button>');
  expect(html).not.toContain('Вернуть версию A');
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
    expect(confirmChangeText('A', 'B')).toBe(
      'Сейчас активна версия A. После подтверждения активной станет версия B.',
    );
    expect(rollbackButtonLabel('A')).toBe('Вернуть версию A');
    expect(rollbackConfirmTitle('A')).toBe('Вернуть версию A?');
    expect(rollbackFailedLine('B')).toBe(
      'Откат не прошёл. Активная версия: B.',
    );
    expect(rollbackUnavailable).toBe(
      'Откат недоступен: предыдущей версии нет.',
    );
    expect(confirmChangeText('B', 'A')).toBe(
      'Сейчас активна версия B. После подтверждения активной станет версия A.',
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

  it('lists the active version and disables rollback when there is no history', () => {
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
    describedReason(html);
    expect(html).not.toContain('role="dialog"');
  });

  it('lists the other account the same way', () => {
    const html = renderAt('/manage/temir/versions');
    expect(html).toContain('Активна версия A');
    expect(html).toContain('temir-v1.zip');
    expect(row(html, 'temir-v1.zip')).toContain('активная версия');
    expect(html).not.toContain('Опубликовать');
    describedReason(html);
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
    describedReason(html);
  });

  it('B3-AC2 confirmation makes B active', () => {
    const html = renderAt('/manage/nan/versions', publishedB());
    expect(html).toContain('Активна версия B');
    expect(html).not.toContain('Активна версия A');
    expect(row(html, 'nan-v2.zip')).toContain('активная версия');
    expect(row(html, 'nan-v1.zip')).not.toContain('активная версия');
    expect(html).toContain('nan-v1.zip');
    expect(html).not.toContain('кандидат');
    expect(html).not.toContain('Опубликовать');
    expect(html).not.toContain('Публикация не прошла');
    expect(html).toContain('>Вернуть версию A</button>');
    expect(html).not.toContain('disabled');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain(rollbackUnavailable);
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
    describedReason(html);
    expect(html).not.toContain('Откат не прошёл');
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

  it('asks before rollback changes the active version', () => {
    const html = renderToStaticMarkup(
      createElement(RollbackDialog, {
        activeLabel: 'B',
        previousLabel: 'A',
        onConfirm() {},
        onClose() {},
      }),
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Вернуть версию A?');
    expect(html).toContain('>Вернуть версию A</button>');
    expect(html).toContain('>Отмена</button>');
    expect(html).toContain(
      'Сейчас активна версия B. После подтверждения активной станет версия A.',
    );
  });

  it('B4-AC1 rolling back after publishing B restores A and keeps both versions', () => {
    const rolled = reducer(publishedB(), { type: 'rollback', slug: 'nan' });
    const kept = rolled.sites.nan?.versions.find(
      (version) => version.archiveName === 'nan-v2.zip',
    );
    const html = renderAt('/manage/nan/versions', rolled);
    expect(kept).toBeTruthy();
    expect(html).toContain('Активна версия A');
    expect(html).not.toContain('Активна версия B');
    expect(row(html, 'nan-v1.zip')).toContain('активная версия');
    expect(row(html, 'nan-v2.zip')).not.toContain('активная версия');
    expect(row(html, 'nan-v2.zip')).not.toContain('кандидат');
    expect(html).toContain('nan-v2.zip');
    if (kept) expect(html).toContain(versionSizeLine(kept));
    describedReason(html);
    expect(html).not.toContain('Откат не прошёл');
    expect(html).not.toContain('role="dialog"');
  });

  it('B4-AC2 disables rollback and explains why when there is no history', () => {
    describedReason(renderAt('/manage/nan/versions'));
    describedReason(renderAt('/manage/temir/versions'));
    const withUpload = renderAt('/manage/nan/versions', withCandidate());
    describedReason(withUpload);
    expect(withUpload).toContain('Активна версия A');
    expect(withUpload).toContain('>Опубликовать версию B</button>');
  });

  it('B4-AC3 a failed rollback keeps the current version label', () => {
    const published = publishedB();
    const html = renderAt(
      '/manage/nan/versions',
      reducer(
        {
          ...published,
          simulate: { ...published.simulate, rollbackFails: true },
        },
        { type: 'rollback', slug: 'nan' },
      ),
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Откат не прошёл. Активная версия: B.');
    expect(html).toContain('Активна версия B');
    expect(html).not.toContain('Активна версия A');
    expect(row(html, 'nan-v2.zip')).toContain('активная версия');
    expect(row(html, 'nan-v1.zip')).not.toContain('активная версия');
    expect(html).toContain('nan-v1.zip');
    expect(html).toContain('nan-v2.zip');
    expect(html).toContain('>Вернуть версию A</button>');
    expect(html).not.toContain('disabled');
    expect(html).not.toContain(rollbackUnavailable);
    expect(html).not.toContain('Публикация не прошла');
  });

  it('offers publish and rollback together when both are possible', () => {
    const html = renderAt(
      '/manage/nan/versions',
      reducer(publishedB(), {
        type: 'upload',
        slug: 'nan',
        archive: archives['nan-v3.zip'],
        uploadedAt: '2026-10-29T13:00:00.000Z',
      }),
    );
    expect(html).toContain('Активна версия B');
    expect(html).toContain('>Опубликовать версию C</button>');
    expect(html).toContain('>Вернуть версию A</button>');
    expect(html).toContain('nan-v1.zip');
    expect(html).toContain('nan-v2.zip');
    expect(html).toContain('nan-v3.zip');
    expect(row(html, 'nan-v3.zip')).toContain('кандидат');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain(rollbackUnavailable);
  });

  it('shows the not-found page for an unknown site', () => {
    const html = renderAt('/manage/missing/versions');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain('Активна версия');
  });
});
