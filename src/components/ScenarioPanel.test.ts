import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline } from '../data/accounts.ts';
import { scenarioById, scenarios, scenarioState } from '../data/scenarios.ts';
import { reducer } from '../state/reducer.ts';
import { StoreProvider, writeSession } from '../state/store.tsx';
import { ScenarioPanel } from './ScenarioPanel.tsx';

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

function renderPanel(): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/manage/nan'] },
      createElement(StoreProvider, null, createElement(ScenarioPanel)),
    ),
  );
}

function tag(html: string, name: string): string {
  return new RegExp(`<${name}\\b[^>]*>`).exec(html)?.[0] ?? '';
}

describe('ScenarioPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('labels the scenario select and lists every preset', () => {
    vi.stubGlobal('sessionStorage', memoryStorage());
    const html = renderPanel();
    const select = tag(html, 'select');
    const button = /<input\b[^>]*>/.exec(html)?.[0] ?? '';
    const selectId = /id="([^"]+)"/.exec(select)?.[1];

    expect(selectId).toBeTruthy();
    expect(html).toContain(`for="${selectId}"`);
    expect(html).toContain('>Сценарий<');
    expect(html).toContain('Не выбран');
    expect(button).toContain('type="button"');
    expect(button).toContain('value="Сбросить"');
    expect(button).not.toContain('disabled');
    expect(select).not.toContain('disabled');
    expect(html).not.toContain('Смена сценария недоступна');

    for (const item of scenarios) {
      expect(html, item.id).toContain(`value="${item.id}"`);
      expect(html, item.id).toContain(item.title);
    }
  });

  it('selects the loaded scenario', () => {
    const storage = memoryStorage();
    const preview = scenarioById('preview-b');
    if (!preview) throw new Error('missing preview-b');
    writeSession(storage, scenarioState(preview));
    vi.stubGlobal('sessionStorage', storage);

    const html = renderPanel();
    expect(html).toMatch(/<option value="preview-b"[^>]*selected/);
  });

  it('disables the controls and states why while a demo runs', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'setDemo', demo: { step: 3 } }),
    );
    vi.stubGlobal('sessionStorage', storage);

    const html = renderPanel();
    const select = tag(html, 'select');
    const button = /<input\b[^>]*>/.exec(html)?.[0] ?? '';
    const describedBy = /aria-describedby="([^"]+)"/.exec(select)?.[1];

    expect(select).toContain('disabled');
    expect(button).toContain('disabled');
    expect(button).toContain(`aria-describedby="${describedBy}"`);
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toContain('Смена сценария недоступна, пока идёт демо.');
  });
});
