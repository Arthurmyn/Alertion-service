/* eslint-disable react-refresh/only-export-components -- the hook and session helpers belong with the provider */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { baseline } from '../data/accounts.ts';
import { scenarioById, scenarioState } from '../data/scenarios.ts';
import { reducer, type Action } from './reducer.ts';
import type { AppState } from './types.ts';

export const SESSION_KEY = 'alertion.session';

const stateKeys = [
  'sessionAccountId',
  'planSelected',
  'sites',
  'lastResult',
  'simulate',
  'scenarioId',
  'demo',
] as const;

type StoreValue = {
  state: AppState;
  dispatch: Dispatch<Action>;
};

const StoreContext = createContext<StoreValue | null>(null);

function isAppState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  const account = record.sessionAccountId;
  return (
    stateKeys.every((key) => key in record) &&
    typeof record.sites === 'object' &&
    record.sites !== null &&
    (account === null || account === 'a' || account === 'b')
  );
}

function readSession(storage: Pick<Storage, 'getItem'>): AppState | null {
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSession(
  storage: Pick<Storage, 'setItem'>,
  state: AppState,
): void {
  try {
    storage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable or full.
  }
}

type SessionRead = Pick<Storage, 'getItem' | 'removeItem'>;

function readScenarioId(search: string): string | null {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  if (!params.has('scenario')) return null;
  return params.get('scenario') ?? '';
}

/** Where `?scenario=` should land. Unknown ids keep the current path. */
export function scenarioQueryRoute(
  search: string,
  pathname: string,
): string | null {
  const id = readScenarioId(search);
  if (id === null) return null;
  return scenarioById(id)?.route ?? (pathname || '/');
}

export function consumeScenarioQuery(
  search: string,
  pathname: string,
  navigate: (route: string, options: { replace: true }) => void,
): void {
  const route = scenarioQueryRoute(search, pathname);
  if (route === null) return;
  navigate(route, { replace: true });
}

export function initialState(storage: SessionRead, search = ''): AppState {
  const id = readScenarioId(search);
  if (id !== null) {
    try {
      storage.removeItem(SESSION_KEY);
    } catch {
      // sessionStorage may be unavailable.
    }
    const scenario = scenarioById(id);
    return scenario ? scenarioState(scenario) : baseline;
  }

  const saved = readSession(storage);
  if (!saved) return baseline;
  return reducer(baseline, { type: 'load', state: saved });
}

function pageSearch(): string {
  if (typeof window === 'undefined') return '';
  return window.location.search;
}

function mountState(fallback: AppState): AppState {
  if (typeof sessionStorage === 'undefined') return fallback;
  return initialState(sessionStorage, pageSearch());
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, baseline, mountState);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    writeSession(sessionStorage, state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used within StoreProvider');
  return value;
}
