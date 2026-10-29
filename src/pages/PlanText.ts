import { LIMITS } from '../data/limits.ts';
import type { AccountId, AppState, Site } from '../state/types.ts';

function countWord(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function ruCount(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  return `${n} ${countWord(n, one, few, many)}`;
}

function sitesPhrase(n: number): string {
  return ruCount(n, 'сайт', 'сайта', 'сайтов');
}

export function siteLimitLine(): string {
  return `${sitesPhrase(LIMITS.sites)} на аккаунт.`;
}

export function archiveLimitLine(): string {
  return `До ${LIMITS.archiveMb} МБ.`;
}

export function unpackedLimitLine(): string {
  return `До ${LIMITS.unpackedMb} МБ.`;
}

export function storageLimitLine(): string {
  const cap = `До ${LIMITS.storageMb} МБ.`;
  if (LIMITS.unpackedMb <= 0 || LIMITS.storageMb % LIMITS.unpackedMb !== 0) {
    return cap;
  }
  const full = LIMITS.storageMb / LIMITS.unpackedMb;
  const versions = ruCount(
    full,
    'полную версию',
    'полных версии',
    'полных версий',
  );
  return `${cap} Это ${versions} по ${LIMITS.unpackedMb} МБ.`;
}

export function ownedSites(state: AppState, ownerId: AccountId): Site[] {
  return Object.values(state.sites).filter((site) => site.ownerId === ownerId);
}

export function accountLimitLine(sites: Site[]): string {
  const count = sitesPhrase(sites.length);
  const names = sites.map((site) => `«${site.businessName}»`).join(', ');
  const limit = sitesPhrase(LIMITS.sites);
  const listed = names === '' ? count : `${count}: ${names}`;
  return `На аккаунте ${listed}. Лимит пилотного плана: ${limit}.`;
}

export function addSiteNotice(result: AppState['lastResult']): string | null {
  if (result?.kind !== 'addSite') return null;
  return result.nextStep;
}
