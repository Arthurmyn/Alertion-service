import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline } from '../../data/accounts.ts';
import {
  scenarioById,
  scenarios,
  scenarioState,
} from '../../data/scenarios.ts';
import { reducer } from '../../state/reducer.ts';
import { StoreProvider, writeSession } from '../../state/store.tsx';
import {
  lockedReason,
  WorkspaceList,
  WorkspaceSwitcher,
} from './WorkspaceSwitcher.tsx';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
  };
}

function renderSwitcher(): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/manage/nan'] },
      createElement(StoreProvider, null, createElement(WorkspaceSwitcher)),
    ),
  );
}

function renderList(query: string, currentId: string | null): string {
  return renderToStaticMarkup(
    createElement(WorkspaceList, {
      query,
      onQuery: () => undefined,
      currentId,
      onChoose: () => undefined,
      onReset: () => undefined,
    }),
  );
}

function trigger(html: string): string {
  return /<button\b[^>]*>/.exec(html)?.[0] ?? '';
}

describe('WorkspaceSwitcher', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks to choose a workspace when nobody is signed in', () => {
    vi.stubGlobal('sessionStorage', memoryStorage());
    const html = renderSwitcher();
    expect(html).toContain('Выберите пространство');
    expect(trigger(html)).toContain('aria-haspopup="true"');
    expect(trigger(html)).toContain('aria-expanded="false"');
    expect(trigger(html)).not.toContain('disabled');
    expect(html).not.toContain(lockedReason);
  });

  it('names the signed-in workspace and its plan', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'a' }),
    );
    vi.stubGlobal('sessionStorage', storage);
    const html = renderSwitcher();
    expect(html).toContain('Пекарня Нан');
    expect(html).toContain('Пилотный');
  });

  it('disables the trigger and states why while a demo runs', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'setDemo', demo: { step: 3 } }),
    );
    vi.stubGlobal('sessionStorage', storage);

    const html = renderSwitcher();
    const describedBy = /aria-describedby="([^"]+)"/.exec(trigger(html))?.[1];
    expect(trigger(html)).toContain('disabled');
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toContain(lockedReason);
  });
});

describe('WorkspaceList', () => {
  it('lists the two workspaces first and every other preset as a scenario', () => {
    const html = renderList('', null);
    expect(html.indexOf('Рабочие пространства')).toBeLessThan(
      html.indexOf('Сценарии'),
    );
    for (const item of scenarios) {
      expect(html, item.id).toContain(item.title);
    }
    expect(html).toContain('>Сбросить<');
    expect(html).toContain('Айгуль С.');
  });

  it('marks the loaded scenario as current', () => {
    const preview = scenarioById('preview-b');
    if (!preview) throw new Error('missing preview-b');
    expect(scenarioState(preview).scenarioId).toBe('preview-b');
    const html = renderList('', 'preview-b');
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
  });

  it('filters by title and says when nothing matches', () => {
    const found = renderList('предпросмотр', null);
    expect(found).toContain('Предпросмотр B');
    expect(found).not.toContain('Выход');
    expect(renderList('zzz', null)).toContain('Ничего не найдено.');
  });
});
