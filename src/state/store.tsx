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

type LoadAction = { type: 'load'; state: AppState };

export type StoreAction = Action | LoadAction;

type StoreValue = {
  state: AppState;
  dispatch: Dispatch<StoreAction>;
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

export function initialState(storage: Pick<Storage, 'getItem'>): AppState {
  // ?scenario= will be applied here, ahead of the saved session.
  return readSession(storage) ?? baseline;
}

export function storeReducer(state: AppState, action: StoreAction): AppState {
  if (action.type === 'load') return action.state;
  return reducer(state, action);
}

function mountState(fallback: AppState): AppState {
  if (typeof sessionStorage === 'undefined') return fallback;
  return initialState(sessionStorage);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, baseline, mountState);

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
