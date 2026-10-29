import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline } from '../data/accounts.ts';
import { reducer } from './reducer.ts';
import {
  SESSION_KEY,
  StoreProvider,
  initialState,
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
  };
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

    const html = renderToStaticMarkup(
      createElement(StoreProvider, null, createElement(SessionAccount)),
    );
    expect(html).toBe('<p>b</p>');
  });

  it('starts from the baseline when the session is empty', () => {
    vi.stubGlobal('sessionStorage', memoryStorage());
    const html = renderToStaticMarkup(
      createElement(StoreProvider, null, createElement(SessionAccount)),
    );
    expect(html).toBe('<p>none</p>');
  });
});
