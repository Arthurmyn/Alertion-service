import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline } from '../data/accounts.ts';
import { scenarioById, scenarioState } from '../data/scenarios.ts';
import { reducer } from './reducer.ts';
import {
  SESSION_KEY,
  StoreProvider,
  consumeScenarioQuery,
  initialState,
  scenarioQueryRoute,
  useStore,
  writeSession,
} from './store.tsx';

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

function renderStore(): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(StoreProvider, null, createElement(SessionAccount)),
    ),
  );
}

function SessionAccount() {
  const { state } = useStore();
  return createElement(
    'p',
    null,
    state.sessionAccountId === null ? 'none' : state.sessionAccountId,
  );
}

describe('store', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps state across a reload', () => {
    const storage = memoryStorage();
    const signedIn = reducer(baseline, { type: 'signIn', accountId: 'a' });
    writeSession(storage, signedIn);

    expect(storage.getItem(SESSION_KEY)).toContain('"sessionAccountId":"a"');
    expect(initialState(storage)).toEqual(
      reducer(baseline, { type: 'load', state: signedIn }),
    );
  });

  it('restores the baseline when load is dispatched', () => {
    const storage = memoryStorage();
    const signedIn = reducer(baseline, { type: 'signIn', accountId: 'b' });
    const drifted = {
      ...signedIn,
      simulate: {
        publishFails: true,
        rollbackFails: true,
        domainCheck: 'fail' as const,
      },
      scenarioId: 'publish-fail',
    };
    const reset = reducer(drifted, { type: 'load', state: baseline });
    writeSession(storage, reset);

    expect(reset).toEqual(baseline);
    expect(initialState(storage)).toEqual(baseline);
  });

  it('ignores a saved session it cannot read', () => {
    const storage = memoryStorage();
    storage.setItem(SESSION_KEY, '{');
    expect(initialState(storage)).toEqual(baseline);

    storage.setItem(SESSION_KEY, '{"sites":null}');
    expect(initialState(storage)).toEqual(baseline);
  });

  it('keeps running when sessionStorage rejects a write', () => {
    const storage = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('full');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };
    expect(() => writeSession(storage, baseline)).not.toThrow();
    expect(initialState(storage)).toEqual(baseline);
  });

  it('reads the saved session when the provider mounts', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'b' }),
    );
    vi.stubGlobal('sessionStorage', storage);

    expect(renderStore()).toBe('<p>b</p>');
  });

  it('starts from the baseline when the session is empty', () => {
    vi.stubGlobal('sessionStorage', memoryStorage());
    expect(renderStore()).toBe('<p>none</p>');
  });

  it('lets ?scenario= replace a saved session', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'b' }),
    );
    const home = scenarioById('a-home');
    if (!home) throw new Error('missing a-home');

    const state = initialState(storage, '?scenario=a-home');
    expect(storage.getItem(SESSION_KEY)).toBeNull();
    expect(state).toEqual(scenarioState(home));
    expect(state.sessionAccountId).toBe('a');
    expect(scenarioQueryRoute('?scenario=a-home', '/login')).toBe(
      '/manage/nan',
    );
  });

  it('ignores an unknown scenario id and preserves the saved session', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'b' }),
    );

    const saved = reducer(baseline, { type: 'signIn', accountId: 'b' });
    expect(initialState(storage, '?scenario=missing')).toEqual(saved);
    expect(storage.getItem(SESSION_KEY)).toBe(JSON.stringify(saved));
    expect(initialState(storage, '?scenario=')).toEqual(saved);
    expect(scenarioQueryRoute('?scenario=missing', '/manage/nan')).toBe(
      '/manage/nan',
    );
    expect(scenarioQueryRoute('', '/login')).toBeNull();
    expect(scenarioQueryRoute('?other=1', '/login')).toBeNull();
  });

  it('removes ?scenario= with replace', () => {
    const calls: Array<[string, { replace: true }]> = [];
    const navigate = (route: string, options: { replace: true }) => {
      calls.push([route, options]);
    };

    consumeScenarioQuery('?scenario=preview-b', '/login', navigate);
    consumeScenarioQuery('?scenario=missing', '/defense', navigate);
    consumeScenarioQuery('', '/login', navigate);

    expect(calls).toEqual([
      ['/manage/nan/preview', { replace: true }],
      ['/defense', { replace: true }],
    ]);
  });

  it('reads ?scenario= from the address when the provider mounts', () => {
    const storage = memoryStorage();
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: 'b' }),
    );
    vi.stubGlobal('sessionStorage', storage);
    vi.stubGlobal('window', {
      location: { search: '?scenario=signed-out', pathname: '/manage/nan' },
    });

    expect(renderStore()).toBe('<p>none</p>');
    expect(storage.getItem(SESSION_KEY)).toBeNull();
  });
});
