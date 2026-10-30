export const NAV_KEY = 'alertion.nav';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export function browserStorage(): StorageLike | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readNavCollapsed(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(NAV_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export function writeNavCollapsed(
  storage: StorageLike | null,
  collapsed: boolean,
): void {
  if (!storage) return;
  try {
    storage.setItem(NAV_KEY, collapsed ? 'collapsed' : 'expanded');
  } catch {
    // localStorage may be unavailable or full.
  }
}
