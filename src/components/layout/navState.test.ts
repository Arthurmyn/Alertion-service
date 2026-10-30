import { describe, expect, it } from 'vitest';
import { NAV_KEY, readNavCollapsed, writeNavCollapsed } from './navState.ts';

function memory() {
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

describe('nav collapsed state', () => {
  it('stays expanded until the flag is stored', () => {
    const storage = memory();
    expect(readNavCollapsed(null)).toBe(false);
    expect(readNavCollapsed(storage)).toBe(false);
    storage.setItem(NAV_KEY, 'collapsed');
    expect(readNavCollapsed(storage)).toBe(true);
    storage.setItem(NAV_KEY, 'expanded');
    expect(readNavCollapsed(storage)).toBe(false);
  });

  it('writes the flag and ignores a storage that throws', () => {
    const storage = memory();
    writeNavCollapsed(storage, true);
    expect(storage.getItem(NAV_KEY)).toBe('collapsed');
    writeNavCollapsed(storage, false);
    expect(storage.getItem(NAV_KEY)).toBe('expanded');

    const broken = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    expect(readNavCollapsed(broken)).toBe(false);
    expect(() => writeNavCollapsed(broken, true)).not.toThrow();
  });
});
