import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoCaption, demoRoute, demoState } from '../data/demoSteps.ts';
import { StoreProvider, writeSession } from '../state/store.tsx';
import { shouldCloseDemo } from './demoClose.ts';
import { DemoBar } from './DemoBar.tsx';

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

function renderBar(step: number | null): string {
  const storage = memoryStorage();
  if (step !== null) writeSession(storage, demoState(step));
  vi.stubGlobal('sessionStorage', storage);
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [step === null ? '/defense' : demoRoute(step)] },
      createElement(StoreProvider, null, createElement(DemoBar)),
    ),
  );
}

function tag(html: string, name: string, label: string): string {
  const pattern = new RegExp(`<${name}\\b[^>]*>${label}</${name}>`);
  return pattern.exec(html)?.[0] ?? '';
}

describe('DemoBar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('closes from escape, and leaves an open dialog alone', () => {
    expect(shouldCloseDemo('Escape', false)).toBe(true);
    expect(shouldCloseDemo('Escape', true)).toBe(false);
    expect(shouldCloseDemo('Enter', false)).toBe(false);
  });

  it('stays hidden until a demo step is set', () => {
    expect(renderBar(null)).toBe('');
  });

  it('shows the step, caption and controls', () => {
    const html = renderBar(1);
    const state = demoState(1);
    expect(html).toContain('Шаг 1 из 10');
    expect(html).toContain(demoCaption(state));
    expect(html).toContain('aria-label="Демо"');
    expect(tag(html, 'button', 'Назад')).toContain('disabled');
    expect(tag(html, 'button', 'Далее')).not.toContain('disabled');
    expect(tag(html, 'button', 'Выйти')).not.toContain('disabled');
    expect(html).toContain('Это первый шаг.');
    expect(html).not.toContain('scenario=reject-');
  });

  it('ends with failure links and a locked next button', () => {
    const html = renderBar(10);
    expect(html).toContain('Шаг 10 из 10');
    expect(html).toContain('Демо завершено.');
    expect(tag(html, 'button', 'Далее')).toContain('disabled');
    expect(html).toContain('Это последний шаг.');
    expect(html).not.toContain('scenario=');
  });
});
