import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App.tsx';
import { baseline } from '../data/accounts.ts';
import { archives, type ArchiveFixture } from '../data/archives.ts';
import { LIMITS } from '../data/limits.ts';
import { reducer } from '../state/reducer.ts';
import { exampleUrl } from '../state/selectors.ts';
import { writeSession } from '../state/store.tsx';
import type { AppState, Site, UploadResult } from '../state/types.ts';
import { UploadView } from './Upload.tsx';
import styles from './Upload.module.css';
import {
  CHECK_DELAY_MS,
  activeLine,
  archiveLegend,
  archiveSizeNote,
  blockReason,
  checkDelay,
  checkingText,
  choiceHeading,
  chooseArchiveText,
  emptyText,
  limitsSummary,
  noArchivesText,
  openPlanText,
  openSiteLead,
  planGateText,
  simulationText,
  successMessage,
  uploadChoices,
  visibleUploadResult,
} from './UploadModel.ts';

function siteOf(state: AppState, slug = 'nan'): Site {
  const site = state.sites[slug];
  if (!site) throw new Error(`no site ${slug}`);
  return site;
}

function fixture(name: string): ArchiveFixture {
  const archive = archives[name];
  if (!archive) throw new Error(`missing ${name}`);
  return archive;
}

function uploaded(state: AppState, name: string): AppState {
  return reducer(state, {
    type: 'upload',
    slug: 'nan',
    archive: fixture(name),
    uploadedAt: '2026-10-29T00:00:00.000Z',
  });
}

function publishAccepted(state: AppState, name: string): AppState {
  return reducer(uploaded(state, name), { type: 'publish', slug: 'nan' });
}

function rejection(state: AppState): UploadResult & { ok: false } {
  const result = state.lastResult;
  if (!result || result.kind !== 'upload' || result.ok) {
    throw new Error('expected a rejected upload');
  }
  return result;
}

function markup(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

function renderView(
  override: Partial<Parameters<typeof UploadView>[0]> = {},
): string {
  const site = override.site ?? siteOf(baseline);
  return markup(
    createElement(
      MemoryRouter,
      null,
      createElement(UploadView, {
        site,
        choices: uploadChoices(site),
        selected: null,
        checking: false,
        result: null,
        planReady: true,
        onSelect() {},
        onCheck() {},
        ...override,
      }),
    ),
  );
}

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

function renderAt(path: string, stored: AppState = baseline): string {
  const storage = memoryStorage();
  writeSession(storage, withOwner(path, stored));
  vi.stubGlobal('sessionStorage', storage);
  return pageMain(
    markup(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(App),
      ),
    ),
  );
}

function button(html: string): string {
  const tag = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/);
  if (!tag) throw new Error('no button');
  return tag[0];
}

function alertText(html: string): string {
  const tag = html.match(/role="alert">([\s\S]*?)<\/div>/);
  if (!tag?.[1]) throw new Error('no alert');
  return tag[1];
}

function liveRegion(html: string): string {
  const at = html.indexOf('aria-live="polite"');
  if (at < 0) throw new Error('no live region');
  const open = html.lastIndexOf('<div', at);
  const close = html.indexOf('</div>', at);
  return html.slice(open, close + '</div>'.length);
}

describe('upload model', () => {
  it('offers this site’s fixtures except the active archive', () => {
    expect(
      uploadChoices(siteOf(baseline)).map((archive) => archive.name),
    ).toEqual([
      'nan-v2.zip',
      'nan-v3.zip',
      'nan-v4.zip',
      'nan-no-index.zip',
      'nan-unsafe.zip',
      'nan-28mb.zip',
      'nan-unpack-60.zip',
      'nan-storage.zip',
    ]);
    expect(uploadChoices(siteOf(baseline, 'temir'))).toEqual([]);
  });

  it('builds limits, sizes and the success line from the store', () => {
    expect(limitsSummary()).toBe(
      `Лимиты пилотного плана: ${LIMITS.sites} сайт, архив ${LIMITS.archiveMb} МБ, распакованная версия ${LIMITS.unpackedMb} МБ, хранилище ${LIMITS.storageMb} МБ.`,
    );
    expect(archiveSizeNote(fixture('nan-v2.zip'))).toBe(
      'архив 5.1 МБ, распакованная версия 18 МБ',
    );
    expect(archiveSizeNote(fixture('nan-28mb.zip'))).toBe('архив 28 МБ');
    expect(archiveSizeNote(fixture('nan-no-index.zip'))).toBeNull();
    expect(choiceHeading(fixture('nan-v2.zip'))).toBe('Версия B');
    expect(choiceHeading(fixture('nan-no-index.zip'))).toBe(
      'Нет index.html в корне',
    );
    expect(choiceHeading(fixture('nan-unsafe.zip'))).toBe('Небезопасный путь');
    expect(choiceHeading(fixture('nan-28mb.zip'))).toBe('Архив 28 МБ');
    expect(choiceHeading(fixture('nan-unpack-60.zip'))).toBe(
      'Архив 8 МБ, распакованная версия 60 МБ',
    );
    expect(choiceHeading(fixture('nan-storage.zip'))).toBe('Версия E');
    expect(activeLine(siteOf(baseline))).toBe('Активная версия: A.');

    const accepted = uploaded(baseline, 'nan-v2.zip');
    expect(successMessage(siteOf(accepted))).toBe(
      'Проверка прошла. Версия B стала кандидатом. Адрес сайта показывает активную версию A.',
    );
    expect(successMessage(siteOf(baseline))).toBeNull();
  });

  it('skips the checking wait when motion is reduced', () => {
    expect(checkDelay(false)).toBe(CHECK_DELAY_MS);
    expect(checkDelay(true)).toBe(0);
    expect(CHECK_DELAY_MS).toBeGreaterThan(0);
  });

  it('states why the check cannot run', () => {
    expect(blockReason(0, null)).toBe(noArchivesText);
    expect(blockReason(3, null)).toBe(chooseArchiveText);
    expect(blockReason(3, 'nan-v2.zip')).toBeNull();
  });

  it('keeps another result off this site', () => {
    const rejected = uploaded(baseline, 'nan-unsafe.zip');
    expect(visibleUploadResult(siteOf(rejected), rejected.lastResult)).toBe(
      rejected.lastResult,
    );
    expect(
      visibleUploadResult(siteOf(rejected, 'temir'), rejected.lastResult),
    ).toBeNull();
    expect(
      visibleUploadResult(siteOf(baseline), {
        kind: 'addSite',
        ok: false,
        nextStep: 'Сайт уже есть.',
      }),
    ).toBeNull();

    const accepted = uploaded(baseline, 'nan-v2.zip');
    expect(visibleUploadResult(siteOf(accepted), accepted.lastResult)).toEqual(
      accepted.lastResult,
    );
    expect(
      visibleUploadResult(siteOf(baseline), accepted.lastResult),
    ).toBeNull();
  });
});

describe('upload screen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty, with labelled fixture radios and a disabled check', () => {
    const html = renderAt('/manage/nan/upload');
    const radios = html.match(/<input[^>]*type="radio"[^>]*>/g) ?? [];

    expect(html).toContain('<h1>Загрузка</h1>');
    expect(html).toContain(activeLine(siteOf(baseline)));
    expect(html).toContain(limitsSummary());
    expect(html).toContain(simulationText);
    expect(html).toContain(archiveLegend);
    expect(html).toContain('Версия B');
    expect(html).toContain('Нет index.html в корне');
    expect(html).toContain('Небезопасный путь');
    expect(liveRegion(html)).toContain(emptyText);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
    expect(radios).toHaveLength(8);
    expect(radios.every((tag) => tag.includes('name="archive"'))).toBe(true);
    expect(html).toContain('nan-v2.zip');
    expect(html).toContain('nan-no-index.zip');
    expect(html).toContain('nan-unsafe.zip');
    expect(html).toContain('nan-28mb.zip');
    expect(html).toContain('nan-unpack-60.zip');
    expect(html).toContain('nan-storage.zip');
    expect(html).not.toContain('nan-v1.zip');
    expect(html).not.toContain('temir-v1.zip');
    expect(html).toContain('обязательно');
    expect(button(html)).toContain('Проверить архив');
    expect(button(html)).toContain('disabled');
    expect(html).toContain(chooseArchiveText);
    expect(html).not.toContain('role="alert"');
  });

  it('enables the check once an archive is chosen', () => {
    const html = renderView({ selected: 'nan-v2.zip' });
    expect(button(html)).not.toContain('disabled');
    expect(html).not.toContain(chooseArchiveText);
    expect(html).toContain('value="nan-v2.zip"');
    expect(html).toContain('checked');
  });

  it('shows the checking line and hides the previous result', () => {
    const rejected = uploaded(baseline, 'nan-28mb.zip');
    const html = renderView({
      checking: true,
      selected: 'nan-28mb.zip',
      result: null,
      site: siteOf(rejected),
    });

    expect(liveRegion(html)).toContain(checkingText);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(button(html)).toContain('disabled');
    expect(html).not.toContain(rejection(rejected).nextStep);
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain(emptyText);
  });

  it('B2-AC1 shows a working example URL after a valid upload', () => {
    const accepted = uploaded(baseline, 'nan-v2.zip');
    const site = siteOf(accepted);
    const href = exampleUrl(site);
    const html = renderAt('/manage/nan/upload', accepted);

    expect(liveRegion(html)).toContain(successMessage(site) ?? '');
    expect(liveRegion(html)).toContain(openSiteLead);
    expect(html).toContain(styles.url);
    expect(html).toMatch(new RegExp(`<a[^>]*href="${href}"[^>]*>${href}</a>`));
    expect(html).toContain(activeLine(site));
    expect(html).not.toContain('role="alert"');
    expect(site.activeVersionId).toBe('nan-v1');
  });

  it('B2-AC2 shows the missing index.html rejection', () => {
    const state = uploaded(baseline, 'nan-no-index.zip');
    const result = rejection(state);
    const html = renderAt('/manage/nan/upload', state);

    expect(alertText(html)).toBe(result.nextStep);
    expect(liveRegion(html)).toContain('role="alert"');
    expect(liveRegion(html)).toContain(result.nextStep);
    expect(result.nextStep).toContain('В архиве нет index.html в корне.');
    expect(result.nextStep).toContain(
      'Переименуйте стартовую страницу в index.html и загрузите архив снова.',
    );
    expect(result.nextStep).not.toContain('Лимит');
    expect(html).not.toContain('href="/site/nan"');
  });

  it('B2-AC3 quotes the unsafe path', () => {
    const state = uploaded(baseline, 'nan-unsafe.zip');
    const result = rejection(state);
    const html = renderAt('/manage/nan/upload', state);

    expect(alertText(html)).toBe(result.nextStep);
    expect(result.nextStep).toContain('../secret.txt');
    expect(result.nextStep).not.toContain('Лимит');
  });

  it('B2-AC4 B7-AC2 shows the limit, the actual size and the next step', () => {
    const cases = [
      ['nan-28mb.zip', baseline],
      ['nan-unpack-60.zip', baseline],
      [
        'nan-storage.zip',
        ['nan-v2.zip', 'nan-v3.zip', 'nan-v4.zip'].reduce(
          publishAccepted,
          baseline,
        ),
      ],
    ] as const;

    for (const [name, start] of cases) {
      const state = uploaded(start, name);
      const result = rejection(state);
      const html = renderAt('/manage/nan/upload', state);

      expect(alertText(html), name).toBe(result.nextStep);
      expect(result.nextStep, name).toContain('Лимит пилотного плана:');
      expect(result.nextStep, name).toContain(`${result.actualMb} МБ`);
      expect(result.nextStep, name).toContain(`${result.limitMb} МБ`);
      expect(result.limitMb, name).toBe(
        name === 'nan-28mb.zip'
          ? LIMITS.archiveMb
          : name === 'nan-unpack-60.zip'
            ? LIMITS.unpackedMb
            : LIMITS.storageMb,
      );
    }
  });

  it('B2-AC5 says the active version did not change', () => {
    for (const name of [
      'nan-no-index.zip',
      'nan-unsafe.zip',
      'nan-28mb.zip',
      'nan-unpack-60.zip',
    ]) {
      const state = uploaded(baseline, name);
      const html = renderAt('/manage/nan/upload', state);
      expect(alertText(html), name).toContain(
        'Активная версия не изменилась: A.',
      );
      expect(html, name).toContain('Активная версия: A.');
      expect(siteOf(state).activeVersionId).toBe('nan-v1');
    }
  });

  it('gates the upload until the pilot plan is chosen', () => {
    const state: AppState = {
      ...baseline,
      planSelected: { a: false, b: true },
    };
    const html = renderAt('/manage/nan/upload', state);

    expect(html).toContain('<h1>Загрузка</h1>');
    expect(html).toContain(`${planGateText}.`);
    expect(html).not.toContain(`>${planGateText}</a>`);
    expect(html).toContain(`>${openPlanText}</a>`);
    expect(html).toContain('href="/manage/nan/plan"');
    expect(html).not.toContain('Проверить архив');
    expect(html).not.toContain('nan-v2.zip');
    expect(html).not.toContain(limitsSummary());
  });

  it('explains an empty fixture list and ignores a foreign result', () => {
    const rejected = uploaded(baseline, 'nan-unsafe.zip');
    const html = renderAt('/manage/temir/upload', rejected);

    expect(html).toContain('<h1>Загрузка</h1>');
    expect(html).toContain(noArchivesText);
    expect(html).toContain('Активная версия: A.');
    expect(button(html)).toContain('disabled');
    expect(html).not.toContain('nan-unsafe.zip');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain(simulationText);
  });

  it('answers an unknown site with the not-found page', () => {
    const html = renderAt('/manage/missing/upload');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain('<h1>Загрузка</h1>');
  });
});
